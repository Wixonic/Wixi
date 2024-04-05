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
    
    #if os(macOS)
    var enabled = false;
    #endif
    
    init(id: String, name: String, view: any View) {
        self.id = id;
        self.name = name;
        self.view = AnyView(view);
    }
    
    #if os(macOS)
    func onEnabled() {}
    func onDisabled() {}
    
    func enable() {
        self.enabled = true;
        
        self.onEnabled();
        
        print("\(self.name) enabled")
    }
    
    func disable() {
        self.enabled = false;
        self.onDisabled();
        
        print("\(self.name) disabled")
    }
    #endif
}
