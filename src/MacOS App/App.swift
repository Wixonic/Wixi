import SwiftUI
import SafariServices

@main
struct MacOSApp: App {
    @Environment(\.openWindow) var openWindow
    
    var body: some Scene {
        Window("Wixi Control Pannel", id: "control-pannel") {
            ContentView()
        }.windowStyle(.hiddenTitleBar)
        
        MenuBarExtra("Wixi", systemImage: "server.rack") {
            Button(action: {
                openWindow(id: "control-pannel")
            }) {
                Text("Open Window")
            }
            
            Button(action: {
                exit(0)
            }) {
                Text("Quit")
            }
        }
    }
}
