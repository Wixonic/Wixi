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

class Plugin {
    static var list: [Plugin] = {
        return [
            BrawlServer(),
            RPCServer(),
            WebServer()
        ]
    }()
    
    static func get(id: String) -> Plugin? {
        for plugin in Plugin.list {
            if (plugin.id == id) {
                return plugin
            }
        }
        
        return nil
    }
    
    let id: String
    let name: String
    let view: AnyView
    
    init(id: String, name: String, view: any View) {
        self.id = id;
        self.name = name;
        self.view = AnyView(view);
    }
    
    #if os(macOS)
    func enable() {}
    func disable() {}
    
    func hardEnable() {
        self.enable();
        
        print("\(self.name) enabled")
    }
    
    func hardDisable() {
        self.disable();
        
        print("\(self.name) disabled")
    }
    #endif
}
