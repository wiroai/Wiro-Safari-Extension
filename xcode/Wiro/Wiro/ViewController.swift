//
//  ViewController.swift
//  Wiro AI
//
//  The setup window: shows whether the Safari extension is on, explains how to
//  turn it on and opens Safari Settings or Safari. It stays open (no quit) and
//  follows the extension's state while the user changes it in Safari.
//

import Cocoa
import SafariServices
import WebKit

let extensionBundleIdentifier = "ai.wiro.safari.Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        refreshState()
    }

    /// Asks Safari whether the extension is on and updates the page.
    func refreshState() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                return
            }

            DispatchQueue.main.async {
                let useSettings: Bool
                if #available(macOS 13, *) {
                    useSettings = true
                } else {
                    useSettings = false
                }
                self.webView.evaluateJavaScript("show(\(state.isEnabled), \(useSettings))")
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? String else {
            return
        }

        switch body {
        case "open-preferences":
            SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { _ in }
        case "open-safari":
            if let safari = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.Safari") {
                NSWorkspace.shared.openApplication(at: safari, configuration: NSWorkspace.OpenConfiguration())
            }
        case "refresh-state":
            refreshState()
        default:
            return
        }
    }

}
