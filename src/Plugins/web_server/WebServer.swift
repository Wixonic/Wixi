import SwiftUI

class WebServer: Plugin {
    #if os(macOS)
    var process = Process()
    
    override func onEnabled() {
        if (!self.process.isRunning) {
            self.process = Process()
            
            switch (utsname.sMachine) {
                case "arm64":
                self.process.executableURL = Bundle.main.url(forResource: "node", withExtension: nil, subdirectory: "Node_arm64/bin")!
                    break
                
                default:
                self.process.executableURL = Bundle.main.url(forResource: "node", withExtension: nil, subdirectory: "Node_x64/bin")!
                    break
            }
            
            self.process.currentDirectoryURL = Bundle.main.url(forResource: "\(self.id)", withExtension: nil, subdirectory: "Plugins")
            self.process.arguments = [Bundle.main.url(forResource: "plugin", withExtension: "js", subdirectory: "Plugins/\(self.id)")!.path(percentEncoded: false)]
            
            do {
                try self.process.run()
            } catch {
                print("Error while starting \(self.name): \(error)")
            }
        }
    }
    
    override func onDisabled() {
        if (self.process.isRunning) {
            self.process.terminate()
        }
    }
    #endif
    
    init() {
        super.init(id: "web_server", name: "Web Server", view: WebServerView())
    }
}

struct WebServerView: View {
    @State var active = false
    
    var body: some View {
        #if os(macOS)
        Toggle(isOn: $active) {
            Text("Listening")
        }.onChange(of: active) {
            if (active) {
                Plugin.get(id: "web_server")!.enable()
            } else {
                Plugin.get(id: "web_server")!.disable()
            }
        }.toggleStyle(.switch)
        .onAppear {
            self.active = Plugin.get(id: "web_server")!.enabled
        }
        #endif
    }
}

#Preview {
    WebServerView()
}
