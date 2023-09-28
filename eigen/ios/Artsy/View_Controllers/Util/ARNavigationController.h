#import <UIKit/UIKit.h>

/// We want the Artwork View Controller to allow rotation, but
/// in order for this to happen by default *every* other view in the
/// heirarchy has to support this. So in this case we only check the top VC.


@interface ARNavigationController : UINavigationController

@property (readonly, nonatomic, strong) UIButton *backButton;
@property (readonly, nonatomic, strong) UIViewController *rootViewController;
@property (readwrite, nonatomic, assign) BOOL animatesLayoverChanges;

- (void)showBackButton:(BOOL)visible animated:(BOOL)animated;

- (IBAction)back:(id)sender;

/// Removes the specified viewController from anywhere in the stack.
- (void)removeViewControllerFromStack:(UIViewController *)viewController;

@end
