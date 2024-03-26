import SwiftUI
import Starscream

class RPCServer: Plugin {
    #if os(macOS)
    var process = Process()
    
    override func enable() {
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
            
            process.currentDirectoryURL = Bundle.main.url(forResource: "\(self.id)", withExtension: nil, subdirectory: "Plugins")
            
            process.arguments = [Bundle.main.url(forResource: "plugin", withExtension: "js", subdirectory: "Plugins/\(self.id)")!.path(percentEncoded: false)]
            
            do {
                try process.run()
            } catch {
                print("Error while starting \(self.name): \(error)")
            }
        }
    }
    
    override func disable() {
        if (process.isRunning) {
            process.terminate()
        }
    }
    #endif
    
    init() {
        super.init(id: "rpc_server", name: "RPC Server", view: RPCServerView())
    }
}

struct RPCServerView: View {
    @State var active = false
    
    var body: some View {
        #if os(macOS)
        Toggle(isOn: $active) {
            Text("Listening")
        }.onChange(of: active) {
            if (active) {
                Plugin.get(id: "rpc_server")!.enable()
            } else {
                Plugin.get(id: "rpc_server")!.disable()
            }
        }.toggleStyle(.switch)
        #endif
    }
}

#Preview {
    RPCServerView()
}