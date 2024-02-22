import SwiftUI

struct Plugin {
    let id: String
    let view: AnyView
}

var viewRegistry: [String: any View] = [
    "http_server": HTTPServerView(),
    "https_server": HTTPSServerView(),
    "wss_server": WSSServerView()
]

var plugins: [Plugin] = {
    var plugins: [Plugin] = []
    
    for (id, view) in viewRegistry {
        plugins.append(Plugin(id: id, view: AnyView(view)))
        print("Plugin \(id) added")
    }
    
    plugins.sort { $0.id < $1.id }
    
    return plugins
}()
