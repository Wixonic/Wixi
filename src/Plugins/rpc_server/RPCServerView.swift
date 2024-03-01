import SwiftUI

class RPCServerManager {
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
            
            process.arguments = [Bundle.main.url(forResource: "plugin", withExtension: "js", subdirectory: "Plugins/rpc_server")!.path(percentEncoded: false)]
            
            do {
                try process.run()
            } catch {
                print("Error while starting RPC Server: \(error)")
            }
        }
    }
    
    func disable() {
        if (process.isRunning) {
            process.terminate()
        }
    }
    #endif
}

struct RPCServerView: View {
    @State var active = false
    
    #if os(macOS)
    var manager = RPCServerManager()
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
