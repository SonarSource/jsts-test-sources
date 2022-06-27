import UIKit
import Interstellar
import SwiftyJSON

typealias SalesPersonCreator = (LiveSale, JWT, BiddingCredentials) -> LiveAuctionsSalesPersonType

class LiveAuctionViewController: UIViewController {
    let saleSlugOrID: String

    lazy var staticDataFetcher: LiveAuctionStaticDataFetcherType = { [weak self] in
        return LiveAuctionStaticDataFetcher(saleSlugOrID: self?.saleSlugOrID ?? "")
    }()

    lazy var salesPersonCreator: SalesPersonCreator = LiveAuctionViewController.salesPerson

    /// This is the offline view when we cannot fetch metaphysics static data
    /// which means we can't connect to the server for JSON data
    fileprivate var offlineView: AROfflineView?
    fileprivate var saleOnHoldBanner: SaleOnHoldOverlayView?
    fileprivate var hasShownSaleOnHoldBanner = false
    fileprivate var saleOnHoldMessage: String?
    fileprivate var showingOverlay = false

    fileprivate var loadingView: LiveAuctionLoadingView?
    fileprivate var saleViewController: LiveAuctionSaleViewController?

    fileprivate var overlaySubscription: ObserverToken<Bool>?
    fileprivate var saleOnHoldSubscription: ObserverToken<(isOnHold: Bool, message: String?)>?
    fileprivate var waitingForInitialLoad = true
    fileprivate var registrationStatusChanged = false
    fileprivate var saleOnHoldMessageSignal: Observable<String?>?

    /// We want to offer ~1 second of delay to allow
    /// the socket to reconnect before we show the disconnect warning
    /// This is mainly to ensure it doesn't consistently flicker on/off
    /// with unpredictable connections
    fileprivate var showSocketDisconnectWarning = false
    fileprivate var waitingToShowDisconnect = false

    // These are injectable during tests.
    lazy var app = UIApplication.shared
    var suppressJumpingToOpenLots = false

    @objc init(saleSlugOrID: String) {
        self.saleSlugOrID = saleSlugOrID

        super.init(nibName: nil, bundle: nil)

        self.title = saleSlugOrID

        // Find out when we've updated registration status
        NotificationCenter.default
            .addObserver(self, selector: #selector(userHasChangedRegistrationStatus), name: NSNotification.Name.ARAuctionArtworkRegistrationUpdated, object: nil)
        NotificationCenter.default
            .addObserver(self, selector: #selector(showSaleOnHoldBanner), name: NSNotification.Name.ARAuctionSaleOnHoldBannerTapped, object: nil)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        app.isIdleTimerDisabled = true

        if waitingForInitialLoad {
            showLoadingView()
            connectToNetwork()
        } else if registrationStatusChanged {
            // we have to ask for a new metaphysics JWT ( as they contain metadata about bidder status )
            // so we need to pull down the current view heirarchy, and recreate it
            // Which luckily, connectToNetwork() does for us via setupWithSale()
            showLoadingView()
            connectToNetwork()
            registrationStatusChanged = false
        }
    }
    
    override var preferredStatusBarStyle: UIStatusBarStyle {
        if showingOverlay {
            return .lightContent
        } else {
            return .`default`
        }
    }

    func showLoadingView() {
        guard loadingView == nil else { return } // Already showing a loading view, don't show another.
        guard let view = view else {
            return
        }

        loadingView = LiveAuctionLoadingView().then {
            $0.operation = { [weak self] in
                self?.dismissLiveAuctionsModal()
            }
            view.addSubview($0)
            $0.align(toView: view)
        }
    }

    func connectToNetwork() {
        staticDataFetcher.fetchStaticData().subscribe { [weak self] result in
            switch result {
            case .success(let (sale, jwt, bidderCredentials)):
                self?.setupWithSale(sale, jwt: jwt, bidderCredentials: bidderCredentials)

            case .error(let error):
                print("Error pulling down sale data for \(String(describing: self?.saleSlugOrID))")
                print("Error: \(error)")
                self?.showOfflineView()
            }
        }
    }

    /// param is hide because it recieves a "connected" signal
    func showSocketDisconnectedOverlay(_ hide: Bool) {
        if hide { actuallyShowDisconnectedOverlay(false) }
        let show = !hide
        showSocketDisconnectWarning = show

        if waitingToShowDisconnect { return }
        if show {
            waitingToShowDisconnect = true

            ar_dispatch_after(1.1) {
                self.waitingToShowDisconnect = false
                if self.showSocketDisconnectWarning == true {
                    self.actuallyShowDisconnectedOverlay(true)
                }
            }
        }
    }

    func actuallyShowDisconnectedOverlay(_ show: Bool) {
        if !show {
            showingOverlay = false
            ar_removeBlurredOverlayWithTitle()
        } else {
            showingOverlay = true
            let title = NSLocalizedString("Artsy has lost contact with the auction house.", comment: "Live websocket disconnect title")
            let subtitle = NSLocalizedString("Attempting to reconnect now", comment: "Live websocket disconnect subtitle")
            let menuButton = BlurredStatusOverlayViewCloseButtonState.show(target: self, selector: #selector(dismissLiveAuctionsModal))
            ar_presentBlurredOverlayWithTitle(title, subtitle: subtitle, buttonState: menuButton)
        }
        
        setNeedsStatusBarAppearanceUpdate()
    }

    func showOfflineView() {
        // Stop the spinner to indicate that it's
        // tried and failed to do it

        guard offlineView == nil else {
            offlineView?.refreshFailed()
            return
        }

        guard let view = view else {
            return
        }

        offlineView = AROfflineView()
        guard let offlineView = offlineView else { return }

        offlineView.delegate = self
        view.addSubview(offlineView)
        offlineView.align(toView: view)

        // As we're not showing a ARSerifNav
        // we don't have a back button yet, so add one

        let dimension = 40
        let closeButton = ARMenuButton()
        closeButton.setBorderColor(.artsyGrayRegular(), for: UIControl.State(), animated: false)
        closeButton.setBackgroundColor(.white, for: UIControl.State(), animated: false)
        closeButton.setImage(UIImage(named:"serif_modal_close"), for: UIControl.State())
        closeButton.addTarget(self, action: #selector(dismissLiveAuctionsModal), for: .touchUpInside)

        offlineView.addSubview(closeButton)
        closeButton.alignTrailingEdge(withView: offlineView, predicate: "-20")
        closeButton.alignTopEdge(withView: offlineView, predicate: "20")
        closeButton.constrainWidth("\(dimension)", height: "\(dimension)")
    }

    @objc func userHasChangedRegistrationStatus() {
        // We receive the notification while not at the foremost of the VC hierarhcy, so we need 
        // to delay until we reappear.
        registrationStatusChanged = true
    }

    @objc func dismissLiveAuctionsModal() {
        overlaySubscription?.unsubscribe()
        saleOnHoldSubscription?.unsubscribe()
        self.presentingViewController?.dismiss(animated: true, completion: nil)
    }

    func updateSaleOnHoldOverlay(onHold: Bool, message: String?) {
        // Important to do this in all cases.
        saleOnHoldMessage = message
        
        if onHold && !hasShownSaleOnHoldBanner {
            // Present a sale-on-hold overlay
            showSaleOnHoldBanner()
            hasShownSaleOnHoldBanner = true
        } else if !onHold {
            // Dismiss any sale-on-hold overlay
            dismissSaleOnHoldBanner()
        }
    }

    @objc func showSaleOnHoldBanner() {
        guard let view = view else {
            return
        }

        saleOnHoldBanner = SaleOnHoldOverlayView(messages: saleOnHoldMessageSignal).then {
            view.addSubview($0)
            $0.align(toView: view)
            $0.delegate = self
        }
        showingOverlay = true
    }

    func dismissSaleOnHoldBanner() {
        saleOnHoldBanner?.removeFromSuperview()
        saleOnHoldBanner = nil
        showingOverlay = false
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)

        app.isIdleTimerDisabled = false
    }

    required init?(coder aDecoder: NSCoder) {
        return nil
    }

    override var shouldAutorotate : Bool {
        return traitDependentAutorotateSupport
    }

    override var supportedInterfaceOrientations : UIInterfaceOrientationMask {
        return traitDependentSupportedInterfaceOrientations
    }
}

extension LiveAuctionViewController: SaleOnHoldOverlayViewDelegate {
    func userDidTapDismiss(forSaleOnHoldOverlayView saleOnHoldOverlayView: SaleOnHoldOverlayView) {
        dismissSaleOnHoldBanner()
    }
}

extension LiveAuctionViewController: AROfflineViewDelegate {
    // Give networking a second shot when offline
    func offlineViewDidRequestRefresh(_ offlineView: AROfflineView!) {
        connectToNetwork()
    }
}

fileprivate typealias PrivateFunctions = LiveAuctionViewController
extension PrivateFunctions {
    func setupWithSale(_ sale: LiveSale, jwt: JWT, bidderCredentials: BiddingCredentials) {
        // Remove any previous view controllers so we can set up fresh.
        if let saleViewController = saleViewController {
            ar_modernRemoveChildViewController(saleViewController)
        }

        // Create a sales person
        let salesPerson = self.salesPersonCreator(sale, jwt, bidderCredentials)

        // Create and add to our hierachry a sale view controller.
        let useCompactLayout = traitCollection.horizontalSizeClass == .compact
        saleViewController = LiveAuctionSaleViewController(sale: sale, salesPerson: salesPerson, useCompactLayout: useCompactLayout, suppressJumpingToOpenLots: suppressJumpingToOpenLots).then {
            // We're bypassing the use of topLayoutGuide here.
            ar_addModernChildViewController($0)
            if let view = view {
                $0.view.alignTop("0", leading: "0", bottom: "0", trailing: "0", toView: view)
            }
            // If we're loading (we probably are) then continue to show the loading view until things complete.
            // We'll dismiss the loading view based on initialStateLoadedSignal.
            if let loadingView = loadingView {
                view.bringSubviewToFront(loadingView)
            }
        }

        // Wait for the initial state to load before removing the loading view.
        salesPerson.initialStateLoadedSignal.subscribe { [weak self] _ in
            self?.loadInitialState(salesPerson: salesPerson)
        }
    }

    func loadInitialState(salesPerson: LiveAuctionsSalesPersonType) {
        waitingForInitialLoad = false
        loadingView?.removeFromSuperview()
        loadingView = nil

        // Dispose of, then create a new overlay subscription for network connectivity issues.
        overlaySubscription?.unsubscribe()
        overlaySubscription = salesPerson.socketConnectionSignal
            .merge(salesPerson.operatorConnectedSignal)
            .map { return $0.0 && $0.1 } // We are connected iff the socket is connected and the operator is connected.
            .subscribe(showSocketDisconnectedOverlay)

        self.saleOnHoldMessageSignal = salesPerson.saleOnHoldSignal.map { $1 }
        
        saleOnHoldSubscription?.unsubscribe()
        saleOnHoldSubscription = salesPerson.saleOnHoldSignal.subscribe { [weak self] (isOnHold, message) in
            self?.updateSaleOnHoldOverlay(onHold: isOnHold, message: message)
        }
    }

    class func salesPerson(_ sale: LiveSale, jwt: JWT, biddingCredentials: BiddingCredentials) -> LiveAuctionsSalesPersonType {
        return LiveAuctionsSalesPerson(sale: sale, jwt: jwt, biddingCredentials: biddingCredentials)
    }
}
