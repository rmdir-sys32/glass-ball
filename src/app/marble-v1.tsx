import Image from "next/image";
import reference from "../images/image.png";

export default function MarbleV1() {
  return <Image src={reference} alt="Version 1: the first red glass marble preview" priority style={{ display: "block", width: "100%", height: "auto" }} />;
}
