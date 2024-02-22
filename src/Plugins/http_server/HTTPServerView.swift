import SwiftUI

struct HTTPServerView: View {
    @State var active = false
    
    var body: some View {
        Toggle(isOn: $active) {
            Text("Listening")
        }
        .toggleStyle(.switch)
    }
}

#Preview {
    HTTPServerView()
}
