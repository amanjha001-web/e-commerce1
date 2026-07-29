import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/" className="text-3xl font-extrabold">
      <span className="text-indigo-600">Shop</span>
      <span className="text-gray-900">Sphere</span>
    </Link>
  );
};

export default Logo;
