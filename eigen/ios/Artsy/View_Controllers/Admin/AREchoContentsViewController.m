#import "AREchoContentsViewController.h"

#import "ArtsyEcho.h"
#import "Artsy-Swift.h"
#import "ARAppDelegate+Echo.h"


enum : NSUInteger {
    Routes,
    Features,
    Messages,
    NumberOfSections
};

static NSString *CellIdentifier = @"Cell";


@interface AREchoContentsViewController ()

@property (nonatomic, strong) ArtsyEcho *echo;
@property (nonatomic, strong) NSArrayOf(Message *) *messages; // Cache messages to ensure deterministic ordering
@property (nonatomic, strong) NSArrayOf(NSString *) * routeKeys;
@property (nonatomic, strong) NSArrayOf(NSString *) * featureKeys;

@end


@implementation AREchoContentsViewController

- (instancetype)init
{
    self = [super initWithStyle:UITableViewStyleGrouped];
    if (!self) {
        return nil;
    }

    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    self.echo = [[ARAppDelegate sharedInstance] echo];
    self.messages = self.echo.messages.allValues;
    self.routeKeys = [self.echo.routes.allKeys sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
    self.featureKeys = [self.echo.features.allKeys sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
    // Let's keep this light-on-dark since it's an admin-only view.
    return UIStatusBarStyleLightContent;
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return NumberOfSections;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    switch (section) {
        case Routes:
            return self.routeKeys.count;
        case Features:
            return self.featureKeys.count;
        case Messages:
            return self.messages.count;
    }
    return 0;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
    switch (section) {
        case Routes:
            return @"Routes";
        case Features:
            return @"Features";
        case Messages:
            return @"Messages";
    }
    return nil;
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section
{
    if (section == NumberOfSections - 1) {
        return [NSString stringWithFormat:@"Last upated %@", self.echo.lastUpdatedDate];
    }
    return nil;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];

    if (!cell) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:CellIdentifier];
    }

    switch (indexPath.section) {
        case Routes: {
            Route *route = self.echo.routes[self.routeKeys[indexPath.row]];
            cell.textLabel.text = route.name;
            cell.detailTextLabel.text = route.path;
        } break;
        case Features: {
            Feature *feature = self.echo.features[self.featureKeys[indexPath.row]];
            cell.textLabel.text = feature.name;
            cell.detailTextLabel.text = feature.state ? @"On" : @"Off";
        } break;
        case Messages: {
            Message *message = self.messages[indexPath.row];
            cell.textLabel.text = message.name;
            cell.detailTextLabel.text = message.content;
        } break;
    }

    return cell;
}
@end
