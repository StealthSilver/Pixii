import type { InfluencerPersonaId } from "@/lib/aiCreator/types";
import type { IconType } from "react-icons";
import {
  FaChartBar,
  FaChartLine,
  FaCrown,
  FaFire,
  FaSkull,
  FaStar,
} from "react-icons/fa";

/** Matches influencer roast personas — use instead of emoji in UI. */
export const PERSONA_ROAST_ICONS: Record<InfluencerPersonaId, IconType> = {
  savage_sarah: FaFire,
  brutally_honest_brad: FaSkull,
  marketing_maven_mia: FaChartBar,
  conversion_king_carlos: FaCrown,
  trendy_tiffany: FaStar,
  data_driven_david: FaChartLine,
};
