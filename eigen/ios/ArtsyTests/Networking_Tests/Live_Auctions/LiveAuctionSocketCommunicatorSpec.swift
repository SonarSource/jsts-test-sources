import Quick
import Nimble
import SwiftyJSON

@testable
import Artsy

var socket: Test_Socket!

class LiveAuctionSocketCommunicatorSpec: QuickSpec {
    override func spec() {
        let host = "squiggly host"
        let jwt = StubbedCredentials.registered.jwt


        let saleID = "honest ed's bargain basement"

        beforeEach {
            socket = Test_Socket()
        }

        it("configures the socket with the correct host") {
            _ = LiveAuctionSocketCommunicator(host: host, causalitySaleID: saleID, jwt: jwt, socketCreator: test_SocketCreator())

            expect(socket.host) == host
        }

        it("connects the socket on initialization") {
            let subject = LiveAuctionSocketCommunicator(host: host, causalitySaleID: saleID, jwt: jwt, socketCreator: test_SocketCreator())

            expect(socket.connected) == true

            _ = subject // Keep a reference around until after expect()
        }

        it("disconnects the socket when deallocated") {
            do {
                _ = LiveAuctionSocketCommunicator(host: host, causalitySaleID: saleID, jwt: jwt, socketCreator: test_SocketCreator())
            }

            expect(socket.connected) == false
        }

        it("sends authentication once connected") {
            let subject = LiveAuctionSocketCommunicator(host: host, causalitySaleID: saleID, jwt: jwt, socketCreator: test_SocketCreator())

            socket.onConnect?()

            let authCalls = socket.writes.filter { $0 == "{\"type\":\"Authorize\",\"jwt\":\"\(jwt.string)\"}" }
            expect(authCalls).to( haveCount(1) )

            _ = subject // Keep a reference around until after expect()
        }

        it("listens for updated auction state") {
            _ = LiveAuctionSocketCommunicator(host: host, causalitySaleID: saleID, jwt: jwt, socketCreator: test_SocketCreator())

            expect(socket.onText).toNot( beNil() )
        }

        it("sends its updatedAuctionState observable its updated auction state") {
            let subject = LiveAuctionSocketCommunicator(host: host, causalitySaleID: saleID, jwt: jwt, socketCreator: test_SocketCreator())

            // "emit" the socket event from the server
            let state = "{\"type\":\"InitialFullSaleState\",\"currentLotId\":\"54c7ecc27261692b5e420600\",\"fullLotStateById\":{}}"
            socket.onText?(state)

            expect(subject.updatedAuctionState.peek() ).toNot( beNil() )
        }

        describe("connected") {
            var subject: LiveAuctionSocketCommunicatorType!
            let bidderCredentials = BiddingCredentials(bidders: [qualifiedBidder], paddleNumber: "123456", userID: "abcd")

            beforeEach {
                subject = LiveAuctionSocketCommunicator(host: host, causalitySaleID: saleID, jwt: jwt, socketCreator: test_SocketCreator())
            }

            func checkForClientMetadata() {
                expect(socket.writes).to( haveCount(1) )
                let json = JSON(parseJSON: socket.writes[0])
                expect(json["event"]["clientMetadata"].dictionary).toNot( beNil() )
                expect(json["event"]["clientMetadata"]["User-Agent"].string).to( contain("Artsy", "Eigen") )
            }

            it("includes clientMetadata in event JSON when bidding") {
                subject.bidOnLot("lot-od", amountCents: 100, bidderCredentials: bidderCredentials, bidUUID: "")
                checkForClientMetadata()
            }

            it("includes clientMetadata in event JSON when leaving a max bid") {
                subject.leaveMaxBidOnLot("lot-id", amountCents: 100, bidderCredentials: bidderCredentials, bidUUID: "")
                checkForClientMetadata()
            }
        }
    }
}

func test_SocketCreator() -> LiveAuctionSocketCommunicator.SocketCreator {
    return { host, causalitySaleID in
        socket.host = host
        return socket
    }
}

class Test_Socket: SocketType {
    var onDisconnect: ((Error?) -> Void)?

    var onText: ((String) -> Void)?
    var onConnect: (() -> Void)?

    var writes = [String]()
    var datas = [Data]()
    var connected = false
    var host = ""

    init() { }


    func write(string: String) { writes += [string] }

    func writePing() { }
    func connect() { connected = true }
    func disconnect() { connected = false }
}
