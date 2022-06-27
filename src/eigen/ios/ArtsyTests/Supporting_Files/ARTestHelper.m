#import "ARTestHelper.h"

#import "ARLogger.h"
#import "ARRouter.h"
#import "ARUserManager.h"

#import <SDWebImage/SDWebImage.h>
#import <SDWebImage/SDImageCache.h>
#import "ARFonts.h"
#import <Emission/AREmission.h>


@implementation ARTestHelper

- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(NSDictionary *)launchOptions;
{
    NSOperatingSystemVersion version = [NSProcessInfo processInfo].operatingSystemVersion;

    NSAssert(version.majorVersion == 15 && version.minorVersion == 2,
             @"The tests should be run on iOS 15.2, not %ld.%ld", version.majorVersion, version.minorVersion);

    CGSize nativeResolution = [UIScreen mainScreen].nativeBounds.size;
    NSAssert([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPhone && CGSizeEqualToSize(nativeResolution, CGSizeMake(1170, 2532)),
             @"The tests should be run on an iPhone 13 Pro, not a device with native resolution %@",
             NSStringFromCGSize(nativeResolution));

    ARPerformWorkAsynchronously = NO;

    // Shared Web Credentials involve async processes that trigger OS alerts and are generally hard to deal with.
    // The related ARUserManager methods can still be invoked, they will just silently do nothing.
    [[ARUserManager sharedManager] disableSharedWebCredentials];

    /// Not really sure what this is for
    [[ARLogger sharedLogger] startLogging];

    // Occasionally we get font issues in snapshots, this _potentially_
    // could be a fix for this.
    __unused UIFont *font = [UIFont serifBoldItalicFontWithSize:12];
    font = [UIFont serifBoldFontWithSize:12];
    font = [UIFont serifSemiBoldFontWithSize:12];
    font = [UIFont serifFontWithSize:12];
    font = [UIFont serifItalicFontWithSize:12];
    font = [UIFont sansSerifFontWithSize:12];
    font = [UIFont smallCapsSerifFontWithSize:12];

    // Ensure that the image cache is just set up for testing
    SDImageCache *imageCache = [[SDImageCache alloc] initWithNamespace:@"Testing" diskCacheDirectory:NSTemporaryDirectory()];
    [[SDWebImageManager sharedManager] setValue:imageCache forKey:@"_imageCache"];

    // You might need to run `yarn bundle:ios` or `yarn bundle-for-native-ci:ios` to generate the jsbundle needed for emission
    AREmission *emission = [[AREmission alloc] initWithState:@{} packagerURL:nil];
    [AREmission setSharedInstance:emission];
    [AREmission.sharedInstance.notificationsManagerModule updateReactState:@{
        @"gravityURL": @"https://stagingapi.artsy.net",
        @"metaphysicsURL": @"https://metaphysics-staging.artsy.net/v2",
        @"predictionURL": @"https://live-staging.artsy.net",
        @"webURL": @"https://staging.artsy.net",
        @"causalityURL": @"wss://causality-staging.artsy.net",
        @"env": @"staging"
    }];
    [ARRouter setup];

    // Needed for "usesDrawRect" based Nimble-Snapshots testing
    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    self.window.rootViewController = [[UIViewController alloc] init];
    [self.window makeKeyAndVisible];

    return YES;
}

@end

#pragma mark - ARTestViewHostingWindow

#import <objc/runtime.h>
#import <unistd.h>
#import <dlfcn.h>
#import <ORKeyboardReactingApplication/ORKeyboardReactingApplication.h>


@implementation ARTestViewHostingWindow

static UIWindow *_hostingWindow = nil;

+ (void)hostView:(UIView *)view;
{
    NSAssert([NSThread isMainThread], @"Should be ran on the main thread.");

    UIView *previousSuperview = view.superview;
    UIWindow *previousKeyWindow = [[UIApplication sharedApplication] keyWindow];

    UIViewController *viewController = [UIViewController new];
    viewController.view.frame = [[UIScreen mainScreen] bounds];
    viewController.view.backgroundColor = [UIColor redColor];
    [viewController.view addSubview:view];

    _hostingWindow = [self new];
    _hostingWindow.rootViewController = viewController;
    [_hostingWindow makeKeyAndVisible];

    [self loadReveal];

    [ORKeyboardReactingApplication registerForCallbackOnKeyDown:ORSpaceKey:^{
        NSAssert([[[UIApplication sharedApplication] keyWindow] isKindOfClass:[ARTestViewHostingWindow class]],
                 @"Current key window is not a ARTestViewHostingWindow");
        _hostingWindow = nil;
    }];

    while (_hostingWindow != nil) {
        CFRunLoopRunInMode(kCFRunLoopDefaultMode, 0.25, false);
    }

    [view removeFromSuperview];
    [previousSuperview addSubview:view];
    [previousKeyWindow makeKeyAndVisible];
}

+ (void)loadReveal;
{
    if (objc_getClass("IBARevealServer") == nil) {
        const char *revealPath = "/Applications/Reveal.app/Contents/SharedSupport/iOS-Libraries/libReveal.dylib";
        if (access(revealPath, R_OK) != 0) {
            NSLog(@"[!] Unable to find the Reveal.app library at: %s", revealPath);
            return;
        }
        if (dlopen(revealPath, RTLD_NOW) == NULL) {
            NSLog(@"[!] Unable to load the Reveal.app library at: %s", revealPath);
            return;
        }
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:@"IBARevealRequestStart" object:nil];
}

@end
