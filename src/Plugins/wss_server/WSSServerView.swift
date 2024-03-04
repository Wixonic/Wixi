import SwiftUI
import Starscream

class WSSServerManager {
    #if os(macOS)
    var process = Process()
    
    func enable() {
        if (!process.isRunning) {
            process = Process()
            
            switch (utsname.sMachine) {
                case "arm64":
                    process.executableURL = Bundle.main.url(forResource: "node", withExtension: nil, subdirectory: "Node_arm64/bin")!
                    break
                
                default:
                    process.executableURL = Bundle.main.url(forResource: "node", withExtension: nil, subdirectory: "Node_x64/bin")!
                    break
            }
            
            process.currentDirectoryURL = Bundle.main.url(forResource: "wss_server", withExtension: nil, subdirectory: "Plugins")
            
            process.arguments = [Bundle.main.url(forResource: "plugin", withExtension: "js", subdirectory: "Plugins/wss_server")!.path(percentEncoded: false)]
            
            do {
                try process.run()
                print("WSSServer started")
            } catch {
                print("Error while starting WSSServer: \(error)")
            }
        }
    }
    
    func disable() {
        if (process.isRunning) {
            process.terminate()
            print("WSS Server terminated")
        }
    }
    #endif
}

class WSSServerDelegate: WebSocketDelegate {
    let socket = WebSocket(request: URLRequest(url: URL(string: "https://server.wixonic.fr:3000")!))
    
    init() {
        socket.delegate = self
        socket.connect()
    }
    
    func didReceive(event: WebSocketEvent, client: WebSocketClient) {
        
    }
}

struct WSSServerView: View {
    @State var active = false
    var socket = WSSServerDelegate()
    
    #if os(macOS)
    var manager = WSSServerManager()
    #endif
    
    var body: some View {
        #if os(macOS)
        Toggle(isOn: $active) {
            Text("Listening")
        }.onChange(of: active) {
            if (active) {
                manager.enable()
            } else {
                manager.disable()
            }
        }.toggleStyle(.switch)
        #endif
    }
}

#Preview {
    WSSServerView()
}
