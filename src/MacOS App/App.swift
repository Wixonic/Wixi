import SwiftUI
import SafariServices

@main
struct MacOSApp: App {
    @NSApplicationDelegateAdaptor(Delegate.self) var delegate
    @Environment(\.openWindow) var openWindow
    
    func quit() {
        Plugin.list.forEach { plugin in
            plugin.disable()
        }
    }
    
    var body: some Scene {
        Window("Control Pannel", id: "control-pannel") {
            ContentView()
        }
        .windowStyle(.hiddenTitleBar)
        
        MenuBarExtra("Wixi", systemImage: "server.rack") {
            Button(action: {
                openWindow(id: "control-pannel")
            }) {
                Text("Open Window")
            }
            
            Button(action: {
                self.quit()
                
                exit(0)
            }) {
                Text("Quit")
            }
        }
    }
}

class Delegate: NSObject, NSApplicationDelegate {
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        MacOSApp().quit()
        return .terminateNow
    }
}
