import UIKit
import Interstellar

class LiveAuctionLotSetViewController: UIViewController {
    let salesPerson: LiveAuctionsSalesPersonType

    let useCompactLayout: Bool
    let auctionDataSource = LiveAuctionSaleLotsDataSource()
    let progressBar = SimpleProgressView()
    let pageController = UIPageViewController(transitionStyle: .scroll, navigationOrientation: .horizontal, options: [:])
    let lotImageCollectionView: UICollectionView
    let lotImageCollectionViewDataSource: LiveAuctionLotCollectionViewDataSource
    let lotCollectionViewLayout: LiveAuctionLotCollectionViewLayoutType
    var currentLotView: LiveAuctionCurrentLotView!
    var currentLotCTAPositionManager: LiveAuctionCurrentLotCTAPositionManager!

    fileprivate var hasBeenSetup = false
    fileprivate var firstAppearance = true
    fileprivate var saleIsOnHold = false
    fileprivate var pageViewScrollView: UIScrollView?
    fileprivate var saleAvailabilityObserver: ObserverToken<SaleAvailabilityState>?
    fileprivate var progressBarBottomConstraintAtRestConstant: CGFloat = -165
    fileprivate var collectionViewBottomConstraint: CGFloat = -288
    fileprivate var progressBarBottomConstraint: NSLayoutConstraint?
    fileprivate let saleNetworkModel = AuctionSaleNetworkModel()
    fileprivate let biddersNetworkModel = AuctionBiddersNetworkModel()
    fileprivate let saleStatusView = SaleStatusView()

    init(salesPerson: LiveAuctionsSalesPersonType, useCompactLayout: Bool) {
        self.salesPerson = salesPerson
        self.useCompactLayout = useCompactLayout

        let dataSource = LiveAuctionLotCollectionViewDataSource(salesPerson: salesPerson)
        lotImageCollectionViewDataSource = dataSource

        let collectionViewLayout: UICollectionViewLayout

        let adjustConstraintsForLargeScreens: Bool

        if useCompactLayout {
            let screenWidthIsLarge = UIScreen.main.bounds.width > 320
            let size: LiveAuctionFancyLotCollectionViewLayout.Size = screenWidthIsLarge ? .normal : .compact
            adjustConstraintsForLargeScreens = (size == .normal)

            let layout = LiveAuctionFancyLotCollectionViewLayout(delegate: dataSource, size: size)
            collectionViewLayout = layout
            lotCollectionViewLayout = layout
        } else {
            let layout = LiveAuctionPlainLotCollectionViewLayout(delegate: dataSource)
            collectionViewLayout = layout
            lotCollectionViewLayout = layout
            adjustConstraintsForLargeScreens = true
        }

        if adjustConstraintsForLargeScreens {
            self.progressBarBottomConstraintAtRestConstant -= 40
            self.collectionViewBottomConstraint -= 40
        }

        lotImageCollectionView = UICollectionView(frame: CGRect.zero, collectionViewLayout: collectionViewLayout).then {
            $0.register(LiveAuctionLotCollectionViewDataSource.CellClass, forCellWithReuseIdentifier: LiveAuctionLotCollectionViewDataSource.CellIdentifier)
            $0.dataSource = dataSource
            $0.backgroundColor = .white
        }

        super.init(nibName: nil, bundle: nil)
    }

    deinit {
        saleAvailabilityObserver?.unsubscribe()
    }

    var hasJumpedToOpenLotAtLaunch = false
    var suppressJumpingToOpenLots = false

    func hasChangedCurrentLot(_ lot: LiveAuctionLotViewModelType?) {
        guard let newLot = lot, let newLotIndex = salesPerson.indexForViewModel(newLot) else { return }

        currentLotCTAPositionManager.currentLotDidChange(to: newLot)

        guard !suppressJumpingToOpenLots else { return }

        /// Support jumping directly to the live lot when we load

        guard hasJumpedToOpenLotAtLaunch else {
            hasJumpedToOpenLotAtLaunch = true
            jumpToLotAtIndex(newLotIndex)
            return
        }

        /// When the lot has changed, we wait a second to see if you are still on the previous lot,
        /// if you are, we'll move you on to the next lot.

        guard let focusedLotIndex = salesPerson.currentFocusedLotIndex.peek() else { return }

        if focusedLotIndex == newLotIndex - 1 {
            ar_dispatch_after(1) {
                guard let focusedLotAfterDelayIndex = self.salesPerson.currentFocusedLotIndex.peek(), focusedLotAfterDelayIndex == focusedLotIndex else { return }

                guard let currentLotVC = self.auctionDataSource.liveAuctionPreviewViewControllerForIndex(newLotIndex) else { return }
                self.currentLotCTAPositionManager.didStartJump(to: newLot)
                self.pageController.setViewControllers([currentLotVC], direction: .forward, animated: true) { _ in
                    self.pageViewController(self.pageController, didFinishAnimating: true, previousViewControllers: [], transitionCompleted: true)
                }
            }
        } else {
            currentLotCTAPositionManager.currentLotDidChange(to: newLot)
            currentLotCTAPositionManager.updateFocusedLotIndex(to: focusedLotIndex)
        }
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        updateTitle()
    }

    required init?(coder aDecoder: NSCoder) {
        return nil
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        self.setupView()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // TODO: handle changing trait collections, need to re-set the collection view layout.
        setupToolbar()
        updateTitle()

        guard firstAppearance else { return }
        firstAppearance = true

        // The collection view "rests" at a non-zero index. We need to set it, but doing so immediately is too soon, so we dispatch to the next runloop invocation.
        ar_dispatch_main_queue {
            let initialRect = CGRect(
                x: self.view.frame.width,
                y: 0,
                width: self.lotImageCollectionView.frame.width,
                height: self.lotImageCollectionView.frame.height
            )
            self.lotImageCollectionView.scrollRectToVisible(initialRect, animated: false)
            self.lotImageCollectionView.reloadData()
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Disable page view scrolling on iPad.
        pageViewScrollView?.isScrollEnabled = (view.window?.traitCollection.horizontalSizeClass == .compact)

        // iPhone X support
        if #available(iOS 11.0, *) {
            currentLotCTAPositionManager.safeBottomMargin = view.safeAreaInsets.bottom
        }
    }

    func setupView() {
        guard let view = view else {
            return
        }

        // Our view setup.
        view.backgroundColor = .white

        // Lot collection view setup.
        view.addSubview(lotImageCollectionView)
        lotImageCollectionView.alignTop("0", leading: "0", bottom: "\(collectionViewBottomConstraint)", trailing: "0", toView: view)

        // Sale status view setup.
        salesPerson.saleOnHoldSignal.subscribe { [weak self] (onHold, _) in
            self?.saleIsOnHold = onHold
            self?.updateTitle()
        }

        // Page view controller setup.
        ar_addModernChildViewController(pageController)
        pageController.delegate = self

        let pageControllerView = pageController.view
        pageControllerView?.align(toView: view)

        // This is a bit of a shame, we need to also make.
        // sure the scrollview resizes on orientation changes.
        if let pageControllerView = pageControllerView,
           let scrollView = pageController.view.subviews.compactMap({ $0 as? UIScrollView }).first {
            scrollView.align(toView: pageControllerView)
            scrollView.delegate = self
        }

        // Progress bar setup.
        view.addSubview(progressBar)
        progressBar.constrainHeight("4")
        progressBar.alignLeading("0", trailing: "0", toView: view)
        progressBarBottomConstraint = progressBar.alignBottomEdge(withView: view, predicate: "\(progressBarBottomConstraintAtRestConstant)")

        // Setup for "current lot" purple view at the bottom of the view.
        currentLotView = LiveAuctionCurrentLotView(viewModel: salesPerson.auctionViewModel.currentLotSignal, salesPerson: salesPerson)
        currentLotView.addTarget(nil, action: #selector(LiveAuctionLotSetViewController.jumpToLiveLot), for: .touchUpInside)
        view.addSubview(currentLotView)
        let jumpToCurrentLotCTABottomConstraint = currentLotView.alignBottomEdge(withView: view, predicate: "-5")
        currentLotView.alignLeadingEdge(withView: view, predicate: "20")
        currentLotView.alignTrailingEdge(withView: view, predicate: "-20")

        currentLotCTAPositionManager = LiveAuctionCurrentLotCTAPositionManager(salesPerson: salesPerson, bottomPositionConstraint: jumpToCurrentLotCTABottomConstraint)

        salesPerson.currentFocusedLotIndex.subscribe { [weak self] _ in
            self?.lotImageCollectionView.reloadData()
        }

        // Final setup for our (now constructed) view hierarchy.
        setupWithInitialData()
    }

    func updateTitle() {
        // Reset everything upfront.
        navigationItem.title = nil
        navigationItem.titleView = nil
        navigationItem.leftBarButtonItem = nil
        // On iPhone, show the sale name, since we're taking up the full screen.
        // Otherwise, on iPad, show nothing (sale name is shown in the lot list).
        if traitCollection.horizontalSizeClass == .compact {
            if saleIsOnHold {
                // Normally we would use `titleView` and not `leftBarButtonItem` but we want the view to be left-aligned instead of centred.
                // 4 leading is for a strange horizontal offset from UIKit.
                navigationItem.leftBarButtonItem = SaleStatusView.barButtonItem(adjustedLeftMarginBy: 4)
                navigationController?.navigationBar.setNeedsLayout()
            } else {
                navigationItem.title = salesPerson.liveSaleName
                // The ARSerifNavigationBar handles titles in its own custom way, this is a hack but it works for now.
                (navigationController as? UINavigationControllerDelegate)?.navigationController?(navigationController!, willShow: self, animated: false)
            }
        }
    }

    func setupToolbar() {
        let close = ARSerifToolbarButtonItem(image: UIImage(named: "serif_modal_close"))
        close.accessibilityLabel = "Exit Live Bidding"
        close.button.addTarget(self, action: #selector(LiveAuctionLotSetViewController.dismissModal), for: .touchUpInside)

        let info = ARSerifToolbarButtonItem(image: UIImage(asset: .Info_icon))
        info.accessibilityLabel = "More Information"
        info.button.addTarget(self, action: #selector(LiveAuctionLotSetViewController.moreInfo), for: .touchUpInside)
        info.isEnabled = false
        saleNetworkModel.fetchSale(salesPerson.liveSaleID)
            .merge(biddersNetworkModel.fetchBiddersForSale(salesPerson.liveSaleID))
            .subscribe { _ in info.isEnabled = true }

        let lots = ARSerifToolbarButtonItem(image: UIImage(asset: .Lots_icon))
        lots.accessibilityLabel = "Show all Lots"
        lots.button.addTarget(self, action: #selector(LiveAuctionLotSetViewController.showLots), for: .touchUpInside)

        let items: [UIBarButtonItem] = useCompactLayout ? [close, lots, info] : [close, info]

        navigationItem.rightBarButtonItems = items
    }

    @objc func dismissModal() {
        AREmission.sharedInstance().notificationsManagerModule.requestModalDismiss()
        // TODO: AppShell, don't need the below code once app shell is done
        guard let presentor = splitViewController?.presentingViewController else { return }
        presentor.dismiss(animated: true, completion: nil)
    }

    @objc func moreInfo() {
        guard let sale = saleNetworkModel.sale else { return }

        let saleVM = SaleViewModel(sale: sale, saleArtworks: [], bidders: biddersNetworkModel.bidders, me: User.current())

        let saleInfoVC = AuctionInformationViewController(saleViewModel: saleVM)
        saleInfoVC.titleViewDelegate = self
        let nav = ARSerifNavigationViewController(rootViewController: saleInfoVC)
        self.navigationController?.present(nav, animated: true, completion: nil)
    }

    @objc func showLots() {
        let lotListController = LiveAuctionLotListViewController(salesPerson: salesPerson, currentLotSignal: salesPerson.currentLotSignal, auctionViewModel: salesPerson.auctionViewModel)
        lotListController.delegate = self
        lotListController.selectedIndex = salesPerson.currentFocusedLotIndex.peek()

        let navController = ARSerifNavigationViewController(rootViewController: lotListController)
        present(navController, animated: true, completion: nil)
    }

    func setupWithInitialData() {
        // Make sure we only initialize with initial data once.
        guard hasBeenSetup == false else { return }
        defer { hasBeenSetup = true }

        auctionDataSource.salesPerson = salesPerson
        auctionDataSource.scrollingDelegate = self

        pageController.dataSource = auctionDataSource

        guard let startVC = auctionDataSource.liveAuctionPreviewViewControllerForIndex(0) else { return }
        pageController.setViewControllers([startVC], direction: .forward, animated: false, completion: nil)

        pageViewScrollView = pageController.view.subviews.compactMap({ $0 as? UIScrollView }).first

        salesPerson
            .currentLotSignal
            .merge(salesPerson.auctionViewModel.saleAvailabilitySignal)
            .subscribe { [weak self] (currentLot, saleAvailability) in
                guard let currentLot = currentLot else {
                    self?.progressBar.progress = saleAvailability == .closed ? 1 : 0
                    return
                }

                let total = self?.salesPerson.auctionViewModel.lotCount ?? 1 // We're dividing by the total, it should not be zero 😬
                let liveLotIndex = self?.salesPerson.indexForViewModel(currentLot)
                self?.progressBar.progress = CGFloat(liveLotIndex ?? 0) / CGFloat(total)
        }

        // To make sure we can handle transitioning to the next live auction
        salesPerson.currentLotSignal.subscribe { [weak self] currentLot in
            self?.hasChangedCurrentLot(currentLot)
        }
    }

    func jumpToLotAtIndex(_ index: Int) {
        guard let currentLotVC = auctionDataSource.liveAuctionPreviewViewControllerForIndex(index) else { return }

        salesPerson.currentFocusedLotIndex.update(index)
        currentLotCTAPositionManager.updateFocusedLotIndex(to: index)
        lotImageCollectionView.reloadData()
        pageController.setViewControllers([currentLotVC], direction: .forward, animated: false) { _ in
            self.currentLotCTAPositionManager.didCompleteJump()
        }
    }

    @objc func jumpToLiveLot() {
        // currentLotSignal might have a nil, and peek() returns a wrapped optional, so we need to double-unwrap.
        guard case let .some(.some(currentLot)) = salesPerson.currentLotSignal.peek() else { return }
        guard let liveLotIndex = salesPerson.indexForViewModel(currentLot) else { return }

        currentLotCTAPositionManager.didStartJump(to: currentLot)
        jumpToLotAtIndex(liveLotIndex)
    }
}

private typealias LotListDelegate = LiveAuctionLotSetViewController
extension LotListDelegate: LiveAuctionLotListViewControllerDelegate {

    func didSelectLotAtIndex(_ index: Int, forLotListViewController lotListViewController: LiveAuctionLotListViewController) {
        jumpToLotAtIndex(index)
        dismiss(animated: true, completion: nil)
    }

}

extension LiveAuctionLotSetViewController: AuctionTitleViewDelegate {
    func userDidPressInfo(_ titleView: AuctionTitleView) {
        // NO-OP, button for this cannot be seen in this context
    }

    func userDidPressIdentityFAQ(_ titleView: AuctionTitleView) {
        // NO-OP, button for this cannot be seen in this context
    }

    func userDidPressRegister(_ titleView: AuctionTitleView) {
        let viewController = ARTNativeScreenPresenterModule.loadWebViewAuctionRegistration(withID: self.salesPerson.liveSaleID)
        if (self.presentedViewController != nil) {
            self.presentedViewController?.present(viewController, animated: true) {}
        } else {
            self.present(viewController, animated: true) {}
        }
        
    }
}

private typealias HostScrollViewDelegate = LiveAuctionLotSetViewController
extension HostScrollViewDelegate: UIScrollViewDelegate {

    // The idea is to match the page view controller's scrollview's content offset to that of our collection view.
    // The collection view data source mimics the page view controller's three-at-a-time display strategy.
    // Our job here is to keep the two in sync, using their contentOffset.
    // The SalesPerson needs to update the currentFocuedLotIndex to match a change in the page view controller's internal layout.

    // When the user scrolls.
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        lotImageCollectionView.setContentOffset(scrollView.contentOffset, animated: false)

        currentLotCTAPositionManager.scrollViewDidScroll(scrollView)
    }

    // When we scroll programmatically with/out animation.
    func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) {
        lotImageCollectionView.setContentOffset(scrollView.contentOffset, animated: false)
    }

    // When the user has released their finger and the scroll view is sliding to a gentle stop.
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        lotImageCollectionView.setContentOffset(scrollView.contentOffset, animated: false)
    }

}

private typealias PageViewDelegate = LiveAuctionLotSetViewController
extension PageViewDelegate: UIPageViewControllerDelegate, LiveAuctionSaleLotsDataSourceScrollableDelgate {
    func pageViewController(_ pageViewController: UIPageViewController, didFinishAnimating finished: Bool, previousViewControllers: [UIViewController], transitionCompleted completed: Bool) {
        guard let viewController = pageViewController.viewControllers?.first as? LiveAuctionLotViewController else { return }

        // The completed parameter specifies if the user has completed the swipe from one page to the next. We want to
        // ignore when they don't, since it is effectively a cancelled transition.
        if completed {
            print("Updating current focused index to:", viewController.index)
            salesPerson.currentFocusedLotIndex.update(viewController.index)
            self.currentLotCTAPositionManager.didCompleteJump()
        }
    }

    func registerForScrollingState(_ viewController: LiveAuctionLotViewController) {
        viewController.bidHistoryState.subscribe { [weak self] state in
            self?.pageViewScrollView?.isScrollEnabled = (state == .closed && self?.view.traitCollection.horizontalSizeClass == .compact)
            return
        }

        viewController.bidHistoryDelta.subscribe { [weak self] update in

            self?.progressBarBottomConstraint?.constant = (self?.progressBarBottomConstraintAtRestConstant ?? 0) + update.delta

            if update.animating {
                self?.lotImageCollectionView.performBatchUpdates({
                    self?.lotCollectionViewLayout.repulsionConstant = abs(update.delta)
                    }, completion: nil)
            } else {
                self?.lotCollectionViewLayout.repulsionConstant = abs(update.delta)
            }

            if update.animating {
                self?.view.layoutIfNeeded()
            }
        }
    }
}
