import { motion } from "framer-motion";

const HeroProducts = () => {
  return (
    <div className="relative hidden h-[650px] lg:block">
      {/* Background Circle */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 6 }}
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100"
      />

      {/* Main Product */}
      <motion.img
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900"
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-3xl object-cover shadow-2xl"
      />

      {/* Watch Card */}
      <motion.div
        animate={{ x: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="absolute right-0 top-10 w-60 rounded-3xl bg-white p-5 shadow-2xl"
      >
        ...
      </motion.div>

      {/* Shoe Card */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute bottom-10 left-0 w-60 rounded-3xl bg-white p-5 shadow-2xl"
      >
        ...
      </motion.div>
    </div>
  );
};

export default HeroProducts;
