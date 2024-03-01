import SwiftUI

#if os(macOS)
extension utsname {
    static var sMachine: String {
        var utsname = utsname()
        uname(&utsname)
        return withUnsafePointer(to: &utsname.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: Int(_SYS_NAMELEN)) {
                String(cString: $0)
            }
        }
    }
}
#endif

struct Plugin {
    let id: String
    let view: AnyView
}

var viewRegistry: [String: any View] = [
    "http_server": HTTPServerView(),
    "https_server": HTTPSServerView(),
    "rpc_server": RPCServerView(),
    "wss_server": WSSServerView()
]

var plugins: [Plugin] = {
    var plugins: [Plugin] = []
    
    for (id, view) in viewRegistry {
        plugins.append(Plugin(id: id, view: AnyView(view)))
    }
    
    plugins.sort { $0.id < $1.id }
    
    return plugins
}()