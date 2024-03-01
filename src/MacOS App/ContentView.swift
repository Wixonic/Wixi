import SwiftUI

struct ContentView: View {
    @State var selectedTab = 0
    
    var body: some View {
        VStack {
            switch (selectedTab) {
                case 0:
                    List {
                        ForEach(plugins, id: \.id) { plugin in
                            Section {
                                plugin.view
                            } header: {
                                Text(plugin.id)
                                    .fontWeight(.semibold)
                                    .font(.headline)
                            }
                            .collapsible(false)
                        }
                    }
                    .listStyle(.sidebar)
                    .scrollContentBackground(.hidden)
                
                case 1:
                    Text("Logs")
                
                case 2:
                    Text("Settings")
                
                default:
                    Text("")
            }
        }
        .toolbar {
            ToolbarItem(placement: .principal) {
                Picker("", selection: $selectedTab) {
                    Text("Plugins").tag(0)
                    Text("Logs").tag(1)
                    Text("Settings").tag(2)
                }
                .pickerStyle(.segmented)
                .padding(.top, 8)
            }
        }
        .frame(minWidth: 500, minHeight: 300)
        .padding()
    }
}

#Preview {
    ContentView()
}
