// slot	timestamp	hash	comment
// 279073352	Jul 22, 2024 at 20:05:29 UTC		0.4.0.0
// 279440968	Jul 24, 2024 at 17:27:49 UTC		0.4.0.1
// 281140432	Aug 2, 2024 at 14:34:28 UTC		0.4.1
// 283218720	Aug 12, 2024 at 21:35:09 UTC		0.4.2

import { CollectionSwapV0_4_0_0, idlSwapV0_4_0_0 } from "./idl_0_4_0_0";
import { CollectionSwapV0_4_0_1, idlSwapV0_4_0_1 } from "./idl_0_4_0_1";
import { CollectionSwapV0_4_1, idlSwapV0_4_1 } from "./idl_0_4_1";
import { CollectionSwapV0_4_2, idlSwapV0_4_2 } from "./idl_0_4_2";

export function getIdlForBlock(
    block: number
): CollectionSwapV0_4_2 | CollectionSwapV0_4_1 | CollectionSwapV0_4_0_1 | CollectionSwapV0_4_0_0 {
    if (block >= 283218720) return idlSwapV0_4_2;
    else if (block >= 281140432) return idlSwapV0_4_1;
    else if (block >= 279440968) return idlSwapV0_4_0_1;
    else if (block >= 279073352) return idlSwapV0_4_0_0;
    else throw new Error("Unsupported block");
}
