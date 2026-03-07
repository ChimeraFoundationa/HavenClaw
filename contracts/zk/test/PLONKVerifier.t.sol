// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PlonkVerifier} from "../src/core/PLONKVerifier.sol";

/// @title PLONKVerifierTest
/// @notice Test for PLONKVerifier with actual 6g_capability_proof data
contract PLONKVerifierTest is Test {
    PlonkVerifier public verifier;

    // Actual proof data generated from circuit
    // Public input: [1] (only 1 public input in current circuit config)
    uint256[1] public publicSignals = [uint256(1)];

    function setUp() public {
        verifier = new PlonkVerifier();
    }

    function testParameters() public view {
        assertEq(verifier.n(), 512, "N should be 512");
        assertEq(verifier.nPublic(), 1, "Should have 1 public input");
    }

    function testVerifyValidProof() public view {
        uint256[24] memory proof = [
            // A
            uint256(11357910817568988376908965481082212814301602060868415052977385966827770484622),
            uint256(15111144524982047191026637714082711674308296674243441415355104141635874915305),
            // B
            uint256(4103078346035274694303549729443869503268420215941836731476408416186067709930),
            uint256(21228782096097979605486261171268350357896348346474840926286153914715529741594),
            // C
            uint256(4067279943895264846779344239010221818978571141014933955480259020948893626559),
            uint256(5420649851269954593509408549744095275529437345425746164744943526529723925697),
            // Z
            uint256(12422905187027982761491746391519426002602889829081989128401569163500628641778),
            uint256(1162697540884169176690613359585030060530522185408431695093258752097006718407),
            // T1
            uint256(13063935642849281229383843746891288575044938748623857125072705374382083113161),
            uint256(8960957910958849098980467310371264107109683045138958808127250579134617888541),
            // T2
            uint256(19321128356115531055025961520803456443352862804009715904180488942271228611061),
            uint256(21845572459753945425895474805910918659647778885629634163495769551987869127362),
            // T3
            uint256(9887943141923065377140343068421610310053209852549253465747993360235161657359),
            uint256(11510793698988379948644980052818321257882307430740043397823287274141346739044),
            // Wxi
            uint256(14811092814299439903455776595573915677996481615050737448390711629387544445305),
            uint256(366459446247042602141066095859675533299598382205489109873925014404730853913),
            // Wxiw
            uint256(15431967616845547304384294441664619805890044201338243534081852728288784911027),
            uint256(8612064791071010221228095247127846060572784983926367585638774984769582965212)
        ];

        uint256[1] memory publicInputs = [uint256(1)];

        bool isValid = verifier.verifyProof(proof, publicInputs);
        assertTrue(isValid, "PLONK proof should be valid");
    }

    function testVerifyInvalidProof() public view {
        uint256[24] memory invalidProof; // All zeros

        uint256[1] memory publicInputs = [uint256(1)];

        bool isValid = verifier.verifyProof(invalidProof, publicInputs);
        assertFalse(isValid, "Invalid proof should fail");
    }
}
