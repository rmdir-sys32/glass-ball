import Image from "next/image";
import reference from "../images/image copy 4.png";

export default function MarbleV2() {
  return <Image src={reference} alt="Version 2: the clear marble with a golden inner swirl" priority style={{ display: "block", width: "100%", height: "auto" }} />;
}
