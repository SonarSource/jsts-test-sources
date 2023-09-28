#import "SaleArtwork.h"

#import "Sale.h"
#import "Artwork.h"

#import "ARMacros.h"
#import "ARSystemTime.h"
#import "ARLogger.h"

// For a number formatter
#import <Artsy+UILabels/Artsy+UILabels.h>

static NSMutableDictionary <NSString *, NSNumberFormatter *> *formattersPerCurrency;

@implementation SaleArtwork

+ (void)initialize
{
    if (self == [SaleArtwork class]) {
        formattersPerCurrency = [NSMutableDictionary dictionary];
    }
}

+ (NSNumberFormatter *)createFormatterForCurrency:(NSString *)currency
{
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterCurrencyStyle;
    formatter.currencyGroupingSeparator = @",";
    formatter.currencySymbol = currency;
    formatter.internationalCurrencySymbol = currency;
    formatter.maximumFractionDigits = 0;
    return formatter;
}

+ (NSDictionary *)JSONKeyPathsByPropertyKey
{
    return @{
             ar_keypath(SaleArtwork.new, saleArtworkID) : @"id",
             ar_keypath(SaleArtwork.new, currencySymbol) : @"symbol",
             ar_keypath(SaleArtwork.new, openingBidCents) : @"opening_bid_cents",
             ar_keypath(SaleArtwork.new, minimumNextBidCents) : @"minimum_next_bid_cents",
             ar_keypath(SaleArtwork.new, saleHighestBid) : @"highest_bid",
             ar_keypath(SaleArtwork.new, artworkNumPositions) : @"bidder_positions_count",
             ar_keypath(SaleArtwork.new, estimateCents) : @"estimate_cents",
             ar_keypath(SaleArtwork.new, lowEstimateCents) : @"low_estimate.cents",
             ar_keypath(SaleArtwork.new, highEstimateCents) : @"high_estimate.cents",
             ar_keypath(SaleArtwork.new, reserveStatus) : @"reserve_status",
             ar_keypath(SaleArtwork.new, lotLabel) : @"lot_label",
             ar_keypath(SaleArtwork.new, bidCount) : @"bidder_positions_count"
             };
}

+ (NSValueTransformer *)auctionJSONTransformer
{
    return [MTLValueTransformer mtl_JSONDictionaryTransformerWithModelClass:[Sale class]];
}

- (ARAuctionState)auctionState
{
    ARAuctionState state = ARAuctionStateDefault;
    NSDate *now = [ARSystemTime date];

    BOOL hasStarted = [self.auction.startDate compare:now] == NSOrderedAscending;
    BOOL hasFinished = self.auction.saleState == SaleStateClosed;
    BOOL notYetStarted = [self.auction.startDate compare:now] == NSOrderedDescending;
    // registrationEndsAtDate is often nil.
    BOOL regstrationClosed = self.auction.registrationEndsAtDate && [self.auction.registrationEndsAtDate compare:now] == NSOrderedAscending;

    if (notYetStarted) {
        state |= ARAuctionStateShowingPreview;
    }

    if (hasStarted && !hasFinished) {
        state |= ARAuctionStateStarted;
    }

    if (hasFinished) {
        state |= ARAuctionStateEnded;
    }

    if (self.bidder) {
        if (!self.bidder.qualifiedForBidding) {
            state |= ARAuctionStateUserPendingRegistration;
        } else {
            state |= ARAuctionStateUserIsRegistered;
        }
    } else {
        if (regstrationClosed) {
            state |= ARAuctionStateUserRegistrationClosed;
        }
    }

    if (self.saleHighestBid) {
        state |= ARAuctionStateArtworkHasBids;
    }

    if (self.positions.count) {
        state |= ARAuctionStateUserIsBidder;
    }

    for (BidderPosition *position in self.positions) {
        if ([self.saleHighestBid isEqual:position.highestBid]) {
            state |= ARAuctionStateUserIsHighBidder;
            break;
        }
    }

    return state;
}

+ (NSValueTransformer *)saleHighestBidJSONTransformer
{
    return [MTLValueTransformer mtl_JSONDictionaryTransformerWithModelClass:[Bid class]];
}

+ (NSValueTransformer *)reserveStatusJSONTransformer
{
    NSDictionary *types = @{
                            @"no_reserve" : @(ARReserveStatusNoReserve),
                            @"reserve_not_met" : @(ARReserveStatusReserveNotMet),
                            @"reserve_met" : @(ARReserveStatusReserveMet),
                            @"reserve_unknown" : @(ARReserveStatusUnknown)
                            };

    return [MTLValueTransformer reversibleTransformerWithForwardBlock:^id(NSString *str) {
        if(!str) { str = @"not for sale"; }
        return types[str];
    } reverseBlock:^id(NSNumber *type) {
        if (!type) { type = @0; }
        return [types allKeysForObject:type].lastObject;
    }];
}

+ (NSValueTransformer *)artworkJSONTransformer
{
    return [MTLValueTransformer mtl_JSONDictionaryTransformerWithModelClass:Artwork.class];
}

- (void)setPositions:(NSArray *)positions
{
    _positions = positions;
}

- (BidderPosition *)userMaxBidderPosition
{
    return [self.positions valueForKeyPath:@"@max.self"];
}

+ (NSString *)dollarsFromCents:(NSNumber *)cents currencySymbol:(NSString *)symbol
{
    NSString *currencyKey = symbol ?: @"$";
    NSNumber *amount = @(roundf(cents.floatValue / 100));

    NSNumberFormatter *formatter = formattersPerCurrency[currencyKey];
    if (formatter) {
        return [formatter stringFromNumber:amount];
    } else {
        NSNumberFormatter *newFormatter = [SaleArtwork createFormatterForCurrency:currencyKey];
        formattersPerCurrency[currencyKey] = newFormatter;
        return [newFormatter stringFromNumber:amount];
    }

}

- (BOOL)hasEstimate
{
    return self.estimateCents || self.lowEstimateCents || self.highEstimateCents;
}

+ (NSString *)estimateStringForEstimate:(NSNumber *_Nullable)estimateCents lowEstimate:(NSNumber *_Nullable)lowEstimateCents highEstimateCents:(NSNumber *_Nullable)highEstimateCents currencySymbol:(NSString *)symbol currency:(NSString *)currency
{
    NSString *estimateValue;
    if (lowEstimateCents && highEstimateCents) {
        estimateValue = [NSString stringWithFormat:@"%@ – %@", [self dollarsFromCents:lowEstimateCents currencySymbol:symbol], [self dollarsFromCents:highEstimateCents currencySymbol:symbol]];
    } else if (estimateCents) {
        estimateValue = [self dollarsFromCents:estimateCents currencySymbol:symbol];
    } else if (lowEstimateCents) {
        estimateValue = [self dollarsFromCents:lowEstimateCents currencySymbol:symbol];
    } else if (highEstimateCents) {
        estimateValue = [self dollarsFromCents:highEstimateCents currencySymbol:symbol];
    } else {
        ARErrorLog(@"Asked for estimate from a sale artwork with no estimate data %@", self);
        estimateValue = @"$0";
    }
    return [NSString stringWithFormat:@"Estimate: %@ %@", estimateValue, currency];
}

- (NSString *)estimateString
{
    return [self.class estimateStringForEstimate:self.estimateCents lowEstimate:self.lowEstimateCents highEstimateCents:self.highEstimateCents currencySymbol:self.currencySymbol currency:self.currency];
}

- (NSString *)numberOfBidsString
{
    NSInteger bids = self.bidCount.integerValue ?: 0;
    return [NSString stringWithFormat:@"(%@ Bid%@)", @(bids), bids != 1 ? @"s" : @""];
}

- (NSString *)highestOrStartingBidString
{
    NSNumber *number;
    if (self.bidCount.integerValue == 0) {
        number = self.openingBidCents;
    } else {
        number = self.saleHighestBid.cents;
    }

    return [SaleArtwork dollarsFromCents:number currencySymbol:self.currencySymbol];
}

- (BOOL)isEqual:(id)object
{
    if ([object isKindOfClass:[self class]]) {
        SaleArtwork *saleArtwork = object;
        return [saleArtwork.saleArtworkID isEqualToString:self.saleArtworkID];
    }

    return [super isEqual:object];
}

- (NSUInteger)hash
{
    return self.saleArtworkID.hash;
}

@end
