const { withAppDelegate } = require('@expo/config-plugins');

const withCustomAppDelegate = (config) => {
  if (!config.ios) {
    console.log('⏭️ No iOS config found, skipping');
    return config;
  }

  return withAppDelegate(config, async (config) => {
    let appDelegate = config.modResults.contents;
    
    // Check is modified
    if (appDelegate.includes('Screen protection - STA')) {
      console.log('Screen protection code is exist, skip modification');
      return config;
    }
    
    // 1. Add security overlay properties after class declaration
    const securityPropertiesCode = `
  /**
  * Screen protection - STA
  * @author Francis
  */

  private var securityOverlayView: UIView?
  private var screenshotPreventionTimer: Timer?`;

    // Find position to add properties
    const classDeclarationRegex = /@UIApplicationMain\s+public class AppDelegate: ExpoAppDelegate \{/;
    if (classDeclarationRegex.test(appDelegate)) {
      appDelegate = appDelegate.replace(
        classDeclarationRegex,
        `@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {${securityPropertiesCode}`
      );
    }

    // 2. Add screen protection methods
    const screenProtectionMethods = `
  // Add black screen overlay for background protection
  private func addSecurityOverlay() {
    guard let window = self.window, securityOverlayView == nil else { return }
    
    // Define security view
    let blackView = UIView(frame: window.bounds)
    blackView.backgroundColor = UIColor.black
    
    let imageView = UIImageView()
    if let image = UIImage(named: "AppIcon60x60@2x") {
      imageView.image = image
    }
    imageView.contentMode = .scaleAspectFit
    imageView.translatesAutoresizingMaskIntoConstraints = false
    
    let protectionLabel = UILabel()
    protectionLabel.text = "Le contenu est protégé"
    protectionLabel.textColor = UIColor.white
    protectionLabel.textAlignment = .center
    protectionLabel.font = UIFont.systemFont(ofSize: 18, weight: .bold)
    protectionLabel.translatesAutoresizingMaskIntoConstraints = false
    
    blackView.addSubview(imageView)
    blackView.addSubview(protectionLabel)
    NSLayoutConstraint.activate([
      imageView.centerXAnchor.constraint(equalTo: blackView.centerXAnchor),
      imageView.centerYAnchor.constraint(equalTo: blackView.centerYAnchor, constant: -50),
      imageView.widthAnchor.constraint(equalToConstant: 100),
      imageView.heightAnchor.constraint(equalToConstant: 100),
      
      protectionLabel.centerXAnchor.constraint(equalTo: blackView.centerXAnchor),
      protectionLabel.topAnchor.constraint(equalTo: imageView.bottomAnchor, constant: 20)
    ])
    
    securityOverlayView = blackView
    window.addSubview(blackView)
  }
  
  // Remove security overlay
  private func removeSecurityOverlay() {
    securityOverlayView?.removeFromSuperview()
    securityOverlayView = nil
  }
  
  // Action when app resign
  public override func applicationWillResignActive(_ application: UIApplication) {
    super.applicationWillResignActive(application)
    addSecurityOverlay()
  }
  
  // Action when app re-active
  public override func applicationDidBecomeActive(_ application: UIApplication) {
    super.applicationDidBecomeActive(application)
    removeSecurityOverlay()
  }

  // Detect recording - version iOS 11+
  @available(iOS 11.0, *)
  @objc private func screenCaptureDidChange() {
    checkRecordingStatus()
  }
  
  private func checkRecordingStatus() {
    if #available(iOS 11.0, *) {
      DispatchQueue.main.async {
        if UIScreen.main.isCaptured {
          // Screen is being recorded
          self.addSecurityOverlay()
        } else {
          self.removeSecurityOverlay()
        }
      }
    }
  }

  // Detect screenshot
  @objc private func userDidTakeScreenshot() {
    DispatchQueue.main.async {
      // print("Take screenshot")
    }
  }

  // Handle all functions of screen protection
  private func setupScreenProtection() {
    // Check initial recording status
    checkRecordingStatus()
    
    // Setup screen recording detection
    if #available(iOS 11.0, *) {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(screenCaptureDidChange),
        name: UIScreen.capturedDidChangeNotification,
        object: nil
      )
    }

    // Setup screenshot detection
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(userDidTakeScreenshot),
      name: UIApplication.userDidTakeScreenshotNotification,
      object: nil
    )
  }
  /* Screen protection - END */`;

    // 3. Find position to add code (before didFinishLaunchingWithOptions)
    const didFinishLaunchingRegex = /public override func application\(/;
    if (didFinishLaunchingRegex.test(appDelegate)) {
      appDelegate = appDelegate.replace(
        didFinishLaunchingRegex,
        `${screenProtectionMethods}

  public override func application(`
      );
    }

    // 4. Add setupScreenProtection() at didFinishLaunchingWithOptions
    const setupScreenProtectionCall = `
    // Screen protection
    setupScreenProtection()`;

    // Find return statement on didFinishLaunchingWithOptions
    const returnStatementRegex = /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/;
    if (returnStatementRegex.test(appDelegate)) {
      appDelegate = appDelegate.replace(
        returnStatementRegex,
        `${setupScreenProtectionCall}

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
      );
    }

    // 5. Update didFinishLaunchingWithOptions method
    const windowInitCode = `    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;

    // Replace existing window initialization if any
    const existingWindowRegex = /let delegate = ReactNativeDelegate\(\)[\s\S]*?#endif/;
    if (existingWindowRegex.test(appDelegate)) {
      appDelegate = appDelegate.replace(existingWindowRegex, windowInitCode);
    }

    console.log('✅ AppDelegate is modify successfully');
    
    config.modResults.contents = appDelegate;
    return config;
  });
};

module.exports = withCustomAppDelegate;