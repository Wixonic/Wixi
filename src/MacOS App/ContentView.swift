import SwiftUI

struct ContentView: View {
    @State var selectedTab = 0
    
    var body: some View {
        VStack {
            switch (selectedTab) {
                case 0:
                    List {
                        ForEach(Plugin.list, id: \.id) { plugin in
                            Section {
                                plugin.view
                            } header: {
                                Text(plugin.name)
                                    .fontWeight(.semibold)
                                    .font(.headline)
                            }
                            .collapsible(false)
                        }
                    }
                    .listStyle(.sidebar)
                    .scrollContentBackground(.hidden)
                
                case 1:
                    Text("Settings")
                
                default:
                    Text("Error")
            }
        }
        .toolbar {
            ToolbarItem(placement: .principal) {
                Picker("", selection: $selectedTab) {
                    Text("Plugins").tag(0)
                    Text("Settings").tag(1)
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
