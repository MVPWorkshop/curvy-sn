import fs from "fs";
import "./wasm_exec.js";

const go = new globalThis.Go();
const wasmBuffer = fs.readFileSync("./script/curvy-core.wasm");
const wasmModule = await WebAssembly.instantiate(wasmBuffer, go.importObject);
go.run(wasmModule.instance);

const exampleK =
    "3576063899451721945708044439715985766371279726122862742776976870604113812456.37433755368962399284959902545857575650980151343940822819955491035764004537420";
const exampleV =
    "13489909641333569590427115533415744099905482762513309747437509971644031039376.4427567575459094607033172187176653672227035382905669517158908590772710424578";

// const exampleK =
//     "68196236400267064573602609471745483657023470841712221200370405540664930863384.26807710239709459398483976456879987828605292244303703134462454036676998532040";
// const exampleV =
//     "21396668295180625570131187733202071656819338507398267934549821761444027366323.9395534657834977306045844845075206496677818405878231607913369506498959259476";

console.log({
    isValidMetaAddress: {
        K: await globalThis.dbg_isValidSECP256k1Point(exampleK),
        V: await globalThis.dbg_isValidBN254Point(exampleV),
    },
});

const exampleR =
    "8032908268850047420310835856206906285330498319822685092362652731173201969170.13254734036709445361265801852305588780842140140385017410438671275976200889563";

const exampleViewTag = "68";

const validBN254Point = exampleR;
const validPointRes = await globalThis.dbg_isValidBN254Point(validBN254Point);
console.log({ validPointRes });

const k = "1fe06f675fc25bc0a5963e81ee4f6717b477311fe78347ea6b5edf2d7860af2";
const v = "513748ba07b5155b89ed5ffa8aa42df8da62ba82cbb718725fd0189dc4796c8";
const Rs = [exampleR];
const viewTags = [exampleViewTag];
const scanResponseRaw = await globalThis.scan(
    JSON.stringify({ k, v, Rs, viewTags })
);

let reconstructedRecipientInfo = await globalThis.get_meta(
    JSON.stringify({ k, v })
);
console.log({ reconstructedRecipientInfo });

console.log({ scanResponseRaw });

const senderInfo = JSON.parse(
    await globalThis.send(JSON.stringify({ K: exampleK, V: exampleV }))
);
console.log({ senderInfo });

const RsGenerated = [senderInfo.R];
const viewTagsGenerated = [senderInfo.viewTag];
const res = await globalThis.scan(
    JSON.stringify({ k, v, Rs: RsGenerated, viewTags: viewTagsGenerated })
);

console.log({ res });
