import { getCustomerProperties, getCustomerAddresses } from "./actions";
import { AddressList } from "./AddressList";

export default async function PropertiesPage() {
  try {
    const [properties, addresses] = await Promise.all([
      getCustomerProperties(),
      getCustomerAddresses(),
    ]);

    return (
      <div className="pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 md:px-6 py-8 md:py-10">
          <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-2">YOUR SPACES</div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#18211F] mb-2">My Properties</h1>
          <p className="text-[#5A6661] max-w-2xl">Manage all your registered properties and addresses. Keep track of service history for each space.</p>
        </div>

        {/* Properties Section */}
        <div className="px-4 md:px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#18211F]">Properties</h2>
              <p className="text-xs text-[#7C8681] mt-1">
                {properties.length} propert{properties.length === 1 ? "y" : "ies"} registered
              </p>
            </div>
            <button className="px-4 py-2.5 bg-[#176B5B] text-white text-sm font-bold rounded-lg hover:bg-[#0D5144] transition">
              + Add Property
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#E2EEE9] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#176B5B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
              </div>
              <p className="text-[#18211F] font-bold text-lg mb-1">No properties yet</p>
              <p className="text-[#5A6661] text-sm">Add your first property to get started with service requests and track maintenance history.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-5 md:p-6 hover:border-[#176B5B] hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#18211F]">{property.name}</h3>
                      <p className="text-xs text-[#7C8681] uppercase tracking-[0.05em] mt-1 capitalize">
                        {property.property_type}
                      </p>
                    </div>
                    <div className="px-2.5 py-1 bg-[#E2EEE9] text-[#176B5B] text-xs font-bold rounded-full flex-shrink-0">
                      Active
                    </div>
                  </div>

                  {(property.address as any)?.[0] && (
                    <div className="mb-4 p-3 bg-[#F7F4EC] rounded-lg">
                      <div className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-[#176B5B] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#7C8681] uppercase tracking-[0.05em]">Address</p>
                          <p className="text-sm font-semibold text-[#18211F] mt-0.5 truncate">
                            {(property.address as any)?.[0]?.label}
                          </p>
                          <p className="text-xs text-[#5A6661] truncate">{(property.address as any)?.[0]?.address_line_1}</p>
                          <p className="text-xs text-[#5A6661] truncate">{(property.address as any)?.[0]?.city}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-[#D9DED8]">
                    <button className="flex-1 px-3 py-2 text-sm font-bold text-[#176B5B] border border-[#D9DED8] rounded-lg hover:bg-[#F1EEE5] transition">
                      Edit
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm font-bold text-white bg-[#176B5B] rounded-lg hover:bg-[#0D5144] transition">
                      View Jobs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Addresses Section */}
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#18211F]">Saved Addresses</h2>
              <p className="text-xs text-[#7C8681] mt-1">
                {addresses.length} address{addresses.length === 1 ? "" : "es"}
              </p>
            </div>
            <button className="px-4 py-2.5 bg-[#176B5B] text-white text-sm font-bold rounded-lg hover:bg-[#0D5144] transition">
              + Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#E2EEE9] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#176B5B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
              </div>
              <p className="text-[#18211F] font-bold text-lg mb-1">No saved addresses</p>
              <p className="text-[#5A6661] text-sm">Add addresses for quick selection when booking services.</p>
            </div>
          ) : (
            <AddressList addresses={addresses} />
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="pb-20 md:pb-0">
        <div className="px-4 md:px-6 py-8">
          <div className="bg-[#F3E1DA] border border-[#DFC0B7] rounded-lg p-6">
            <h2 className="text-lg font-bold text-[#A9523D] mb-2">Error Loading Properties</h2>
            <p className="text-[#8B4A31]">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
