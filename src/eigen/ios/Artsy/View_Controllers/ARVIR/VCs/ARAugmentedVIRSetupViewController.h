#import <UIKit/UIKit.h>

@class ARAugmentedRealityConfig;

/**
 This class' responsibilities are to ensure the ARVIR permissions are set up, and to
 provide a clue to the general usage via a video.
 */
@interface ARAugmentedVIRSetupViewController : UIViewController 

- (instancetype)initWithMovieURL:(NSURL *)movieURL config:(ARAugmentedRealityConfig *)config;

/// Is AR even supported?
+ (BOOL)canOpenARView;
/// Have they already given access, and placed a work?
+ (void)canSkipARSetup:(NSUserDefaults *)defaults callback:(void (^)(bool allowedAccess))closure;
/// Request access
+ (void)validateAVAccess:(NSUserDefaults *)defaults callback:(void (^)(bool allowedAccess))closure;
@end
