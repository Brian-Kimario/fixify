import { getCustomerProperties, getCustomerAddresses } from "./actions";
import { AddressListSection } from "./AddressListSection";
import { PropertiesSection } from "./PropertiesSection";

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
        <PropertiesSection initialProperties={properties} addresses={addresses} />

        {/* Addresses Section */}
        <AddressListSection initialAddresses={addresses} />
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
