import SwiftUI

struct ContentView: View {
    #if os(macOS)
    @State var state = false
    @State var process = Process()
    
    var paths: [String: Any] {
        #if arch(arm64)
        let nodeDirectory = "Node_arm64"
        #else
        let nodeDirectory = "Node_x64"
        #endif
        
        return [
            "node": Bundle.main.url(forResource: "node", withExtension: nil, subdirectory: "\(nodeDirectory)/bin")!.path,
            "plugins": [
                "folder": Bundle.main.url(forResource: "Plugins", withExtension: nil)!,
                "list": Bundle.main.url(forResource: "list", withExtension: "json", subdirectory: "Plugins")!.path,
            ],
            "server": Bundle.main.url(forResource: "main", withExtension: "js", subdirectory: "Server")!.path
        ]
    }
    
    func changeState() {
        if (state && !process.isRunning) {
            process = Process()
            process.executableURL = URL(filePath: paths["node"] as! String)
            process.arguments = [paths["server"] as! String]
            
            NotificationCenter.default.addObserver(forName: Process.didTerminateNotification, object: process, queue: nil) { _ in
                print("Server stopped")
            }
            
            print("Starting server")
            do {
                try process.run()
            } catch {
                print("Failed to start server:", error.localizedDescription)
            }
        } else if (process.isRunning && !state) {
            print("Terminating server")
            process.terminate()
        }
    }
    #else
    var serverURL = "wss://server.wixonic.fr:3000"
    #endif
    
    var body: some View {
        VStack {
            #if os(macOS)
            Toggle("Server", isOn: $state)
                .onChange(of: state) {
                    changeState()
                }
            #endif
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
