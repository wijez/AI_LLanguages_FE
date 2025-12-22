import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Spinner from "./Spinner";

export default function RouteLoading() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const t = setTimeout(() => {
      setLoading(false);
    }, 300); 

    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!loading) return null;
  return <Spinner />;
}
