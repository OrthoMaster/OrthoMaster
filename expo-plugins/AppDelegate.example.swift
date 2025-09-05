import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  /**
  * Screen protection - STA
  * @author Francis
  */

  private var securityOverlayView: UIView?
  private var screenshotPreventionTimer: Timer?

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
  /* Screen protection - END */

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
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
#endif

    // Screen protection
    setupScreenProtection()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
