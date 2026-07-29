import { FiTruck, FiShield, FiRotateCcw } from "react-icons/fi";

const HeroFeatures = () => {
  return (
    <div className="mt-12 flex flex-wrap gap-8">
      <div>
        <h3 className="text-2xl font-bold">50K+</h3>

        <p className="text-gray-500">Happy Customers</p>
      </div>

      <div className="flex items-center gap-2">
        <FiTruck className="text-indigo-600" />

        <span>Free Delivery</span>
      </div>

      <div className="flex items-center gap-2">
        <FiShield className="text-indigo-600" />

        <span>Secure Payment</span>
      </div>

      <div className="flex items-center gap-2">
        <FiRotateCcw className="text-indigo-600" />

        <span>Easy Return</span>
      </div>
    </div>
  );
};

export default HeroFeatures;
