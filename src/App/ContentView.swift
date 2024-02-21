import SwiftUI

struct ContentView: View {
    #if os(macOS)
    @State var state = false
    @State var process = Process()
    
    var paths: [String: String] {
        #if arch(arm64)
        let nodeDirectory = "Node_arm64"
        #else
        let nodeDirectory = "Node_x64"
        #endif
        
        let p = [
            "node": Bundle.main.url(forResource: "node", withExtension: "", subdirectory: "\(nodeDirectory)/bin")!.path,
            "server": Bundle.main.url(forResource: "main", withExtension: "js", subdirectory: "Server")!.path
        ]
        
        return p
    }
    
    func changeState() {
        if (state && !process.isRunning) {
            process = Process()
            process.executableURL = URL(filePath: paths["node"]!)
            process.arguments = [paths["server"]!]
            
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
