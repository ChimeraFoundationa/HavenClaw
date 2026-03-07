// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract PlonkVerifier {
    // Omega
    uint256 constant w1 =
        6_837_567_842_312_086_091_520_287_814_181_175_430_087_169_027_974_246_751_610_506_942_214_842_701_774;
    // Scalar field size
    uint256 constant q =
        21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617;
    // Base field size
    uint256 constant qf =
        21_888_242_871_839_275_222_246_405_745_257_275_088_696_311_157_297_823_662_689_037_894_645_226_208_583;

    // [1]_1
    uint256 constant G1x = 1;
    uint256 constant G1y = 2;
    // [1]_2
    uint256 constant G2x1 =
        10_857_046_999_023_057_135_944_570_762_232_829_481_370_756_359_578_518_086_990_519_993_285_655_852_781;
    uint256 constant G2x2 =
        11_559_732_032_986_387_107_991_004_021_392_285_783_925_812_861_821_192_530_917_403_151_452_391_805_634;
    uint256 constant G2y1 =
        8_495_653_923_123_431_417_604_973_247_489_272_438_418_190_587_263_600_148_770_280_649_306_958_101_930;
    uint256 constant G2y2 =
        4_082_367_875_863_433_681_332_203_403_145_435_568_316_851_327_593_401_208_105_741_076_214_120_093_531;

    // Verification Key data
    uint32 constant n = 512;
    uint16 constant nPublic = 1;
    uint16 constant nLagrange = 1;

    uint256 constant Qmx =
        5_003_442_433_755_869_501_502_612_356_250_093_134_880_925_449_890_824_475_461_944_297_814_769_541_888;
    uint256 constant Qmy =
        11_387_241_299_744_255_387_668_694_995_084_871_083_107_793_883_167_551_881_405_717_632_756_061_984_585;
    uint256 constant Qlx =
        11_969_848_311_414_496_106_708_823_371_455_365_969_432_644_646_524_069_183_415_203_497_687_995_130_788;
    uint256 constant Qly =
        2_978_253_352_616_339_561_617_350_694_544_348_168_847_242_603_816_720_677_451_865_491_299_545_206_480;
    uint256 constant Qrx =
        14_002_212_752_924_552_824_139_496_831_773_197_209_590_255_185_339_234_465_414_035_713_281_368_934_521;
    uint256 constant Qry =
        17_826_381_676_205_405_763_095_024_297_027_434_247_467_842_156_152_409_322_121_987_415_849_774_834_176;
    uint256 constant Qox =
        19_641_637_146_452_691_079_697_504_885_567_682_513_376_317_262_774_770_658_697_489_550_757_872_652_278;
    uint256 constant Qoy =
        7_722_188_782_118_399_109_900_713_025_116_652_115_720_179_323_331_755_115_776_576_984_194_537_596_428;
    uint256 constant Qcx =
        20_997_586_573_421_587_188_877_862_691_935_822_037_681_164_691_200_025_469_003_404_872_905_110_382_707;
    uint256 constant Qcy =
        1_085_593_466_133_896_333_288_948_302_808_930_178_462_775_517_144_267_429_673_675_812_497_827_248_634;
    uint256 constant S1x =
        3_298_296_885_329_175_513_709_362_766_811_391_494_482_927_189_325_520_771_338_318_552_533_804_774_108;
    uint256 constant S1y =
        17_493_713_815_549_627_067_244_066_968_847_572_820_463_323_274_409_306_761_980_627_782_852_859_650_932;
    uint256 constant S2x =
        15_001_324_349_599_367_174_456_804_178_453_627_161_502_255_492_926_878_413_911_865_235_557_900_396_027;
    uint256 constant S2y =
        16_434_538_307_535_000_300_204_023_237_629_378_210_690_402_953_418_794_954_813_779_398_090_054_719_636;
    uint256 constant S3x =
        14_379_823_533_777_130_758_436_557_937_758_827_508_999_868_260_846_918_182_452_633_675_758_467_365_695;
    uint256 constant S3y =
        8_472_289_591_966_054_175_071_158_420_829_043_904_878_564_688_054_753_169_204_078_580_121_935_657_733;
    uint256 constant k1 = 2;
    uint256 constant k2 = 3;
    uint256 constant X2x1 =
        17_473_618_109_703_625_644_491_277_615_060_793_968_170_360_605_476_040_203_858_473_229_349_254_899_149;
    uint256 constant X2x2 =
        21_481_367_069_011_709_032_682_409_589_853_329_987_754_353_809_636_394_968_103_419_865_710_257_053_093;
    uint256 constant X2y1 =
        19_148_871_659_264_996_104_359_216_249_481_186_955_728_725_635_849_448_552_488_412_928_889_779_848_752;
    uint256 constant X2y2 =
        805_966_671_832_572_720_047_997_774_525_994_061_058_882_108_320_195_192_675_278_477_992_900_088_276;

    // Proof calldata
    // Byte offset of every parameter of the calldata
    // Polynomial commitments
    uint16 constant P_A = 4 + 0;
    uint16 constant P_B = 4 + 64;
    uint16 constant P_C = 4 + 128;
    uint16 constant P_Z = 4 + 192;
    uint16 constant P_T1 = 4 + 256;
    uint16 constant P_T2 = 4 + 320;
    uint16 constant P_T3 = 4 + 384;
    uint16 constant P_WXI = 4 + 448;
    uint16 constant P_WXIW = 4 + 512;
    // Opening evaluations
    uint16 constant P_EVAL_A = 4 + 576;
    uint16 constant P_EVAL_B = 4 + 608;
    uint16 constant P_EVAL_C = 4 + 640;
    uint16 constant P_EVAL_S1 = 4 + 672;
    uint16 constant P_EVAL_S2 = 4 + 704;
    uint16 constant P_EVAL_ZW = 4 + 736;

    // Memory data
    // Challenges
    uint16 constant P_ALPHA = 0;
    uint16 constant P_BETA = 32;
    uint16 constant P_GAMMA = 64;
    uint16 constant P_XI = 96;
    uint16 constant P_XIN = 128;
    uint16 constant P_BETA_XI = 160;
    uint16 constant P_V1 = 192;
    uint16 constant P_V2 = 224;
    uint16 constant P_V3 = 256;
    uint16 constant P_V4 = 288;
    uint16 constant P_V5 = 320;
    uint16 constant P_U = 352;

    uint16 constant P_PI = 384;
    uint16 constant P_EVAL_R0 = 416;
    uint16 constant P_D = 448;
    uint16 constant P_F = 512;
    uint16 constant P_E = 576;
    uint16 constant P_TMP = 640;
    uint16 constant P_ALPHA2 = 704;
    uint16 constant P_ZH = 736;
    uint16 constant P_ZH_INV = 768;

    uint16 constant P_EVAL_L1 = 800;

    uint16 constant LAST_MEM = 832;

    function verifyProof(uint256[24] calldata _proof, uint256[1] calldata _pubSignals) public view returns (bool) {
        assembly {
            /////////
            // Computes the inverse using the extended euclidean algorithm
            /////////
            function inverse(a, q) -> inv {
                let t := 0
                let newt := 1
                let r := q
                let newr := a
                let quotient
                let aux

                for { } newr { } {
                    quotient := sdiv(r, newr)
                    aux := sub(t, mul(quotient, newt))
                    t := newt
                    newt := aux

                    aux := sub(r, mul(quotient, newr))
                    r := newr
                    newr := aux
                }

                if gt(r, 1) { revert(0, 0) }
                if slt(t, 0) { t := add(t, q) }

                inv := t
            }

            ///////
            // Computes the inverse of an array of values
            // See https://vitalik.ca/general/2018/07/21/starks_part_3.html in section where explain fields operations
            //////
            function inverseArray(pVals, n) {
                let pAux := mload(0x40) // Point to the next free position
                let pIn := pVals
                let lastPIn := add(pVals, mul(n, 32)) // Read n elements
                let acc := mload(pIn) // Read the first element
                pIn := add(pIn, 32) // Point to the second element
                let inv

                for { } lt(pIn, lastPIn) {
                    pAux := add(pAux, 32)
                    pIn := add(pIn, 32)
                } {
                    mstore(pAux, acc)
                    acc := mulmod(acc, mload(pIn), q)
                }
                acc := inverse(acc, q)

                // At this point pAux pint to the next free position we subtract 1 to point to the last used
                pAux := sub(pAux, 32)
                // pIn points to the n+1 element, we subtract to point to n
                pIn := sub(pIn, 32)
                lastPIn := pVals // We don't process the first element
                for { } gt(pIn, lastPIn) {
                    pAux := sub(pAux, 32)
                    pIn := sub(pIn, 32)
                } {
                    inv := mulmod(acc, mload(pAux), q)
                    acc := mulmod(acc, mload(pIn), q)
                    mstore(pIn, inv)
                }
                // pIn points to first element, we just set it.
                mstore(pIn, acc)
            }

            function checkField(v) {
                if iszero(lt(v, q)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPointBelongsToBN128Curve(p) {
                let x := calldataload(p)
                let y := calldataload(add(p, 32))

                // Check that the point is on the curve
                // y^2 = x^3 + 3
                let x3_3 := addmod(mulmod(x, mulmod(x, x, qf), qf), 3, qf)
                let y2 := mulmod(y, y, qf)

                if iszero(eq(x3_3, y2)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkProofData() {
                // Check proof commitments belong to the bn128 curve
                checkPointBelongsToBN128Curve(P_A)
                checkPointBelongsToBN128Curve(P_B)
                checkPointBelongsToBN128Curve(P_C)
                checkPointBelongsToBN128Curve(P_Z)
                checkPointBelongsToBN128Curve(P_T1)
                checkPointBelongsToBN128Curve(P_T2)
                checkPointBelongsToBN128Curve(P_T3)
                checkPointBelongsToBN128Curve(P_WXI)
                checkPointBelongsToBN128Curve(P_WXIW)

                // Check proof commitments coordinates are in the field
                checkField(calldataload(P_A))
                checkField(calldataload(add(P_A, 32)))
                checkField(calldataload(P_B))
                checkField(calldataload(add(P_B, 32)))
                checkField(calldataload(P_C))
                checkField(calldataload(add(P_C, 32)))
                checkField(calldataload(P_Z))
                checkField(calldataload(add(P_Z, 32)))
                checkField(calldataload(P_T1))
                checkField(calldataload(add(P_T1, 32)))
                checkField(calldataload(P_T2))
                checkField(calldataload(add(P_T2, 32)))
                checkField(calldataload(P_T3))
                checkField(calldataload(add(P_T3, 32)))
                checkField(calldataload(P_WXI))
                checkField(calldataload(add(P_WXI, 32)))
                checkField(calldataload(P_WXIW))
                checkField(calldataload(add(P_WXIW, 32)))

                // Check proof evaluations are in the field
                checkField(calldataload(P_EVAL_A))
                checkField(calldataload(P_EVAL_B))
                checkField(calldataload(P_EVAL_C))
                checkField(calldataload(P_EVAL_S1))
                checkField(calldataload(P_EVAL_S2))
                checkField(calldataload(P_EVAL_ZW))
            }

            function calculateChallenges(pMem, pPublic) {
                let beta
                let aux

                let mIn := mload(0x40) // Pointer to the next free memory position

                // Compute challenge.beta & challenge.gamma
                mstore(mIn, Qmx)
                mstore(add(mIn, 32), Qmy)
                mstore(add(mIn, 64), Qlx)
                mstore(add(mIn, 96), Qly)
                mstore(add(mIn, 128), Qrx)
                mstore(add(mIn, 160), Qry)
                mstore(add(mIn, 192), Qox)
                mstore(add(mIn, 224), Qoy)
                mstore(add(mIn, 256), Qcx)
                mstore(add(mIn, 288), Qcy)
                mstore(add(mIn, 320), S1x)
                mstore(add(mIn, 352), S1y)
                mstore(add(mIn, 384), S2x)
                mstore(add(mIn, 416), S2y)
                mstore(add(mIn, 448), S3x)
                mstore(add(mIn, 480), S3y)

                mstore(add(mIn, 512), calldataload(add(pPublic, 0)))

                mstore(add(mIn, 544), calldataload(P_A))
                mstore(add(mIn, 576), calldataload(add(P_A, 32)))
                mstore(add(mIn, 608), calldataload(P_B))
                mstore(add(mIn, 640), calldataload(add(P_B, 32)))
                mstore(add(mIn, 672), calldataload(P_C))
                mstore(add(mIn, 704), calldataload(add(P_C, 32)))

                beta := mod(keccak256(mIn, 736), q)
                mstore(add(pMem, P_BETA), beta)

                // challenges.gamma
                mstore(add(pMem, P_GAMMA), mod(keccak256(add(pMem, P_BETA), 32), q))

                // challenges.alpha
                mstore(mIn, mload(add(pMem, P_BETA)))
                mstore(add(mIn, 32), mload(add(pMem, P_GAMMA)))
                mstore(add(mIn, 64), calldataload(P_Z))
                mstore(add(mIn, 96), calldataload(add(P_Z, 32)))

                aux := mod(keccak256(mIn, 128), q)
                mstore(add(pMem, P_ALPHA), aux)
                mstore(add(pMem, P_ALPHA2), mulmod(aux, aux, q))

                // challenges.xi
                mstore(mIn, aux)
                mstore(add(mIn, 32), calldataload(P_T1))
                mstore(add(mIn, 64), calldataload(add(P_T1, 32)))
                mstore(add(mIn, 96), calldataload(P_T2))
                mstore(add(mIn, 128), calldataload(add(P_T2, 32)))
                mstore(add(mIn, 160), calldataload(P_T3))
                mstore(add(mIn, 192), calldataload(add(P_T3, 32)))

                aux := mod(keccak256(mIn, 224), q)
                mstore(add(pMem, P_XI), aux)

                // challenges.v
                mstore(mIn, aux)
                mstore(add(mIn, 32), calldataload(P_EVAL_A))
                mstore(add(mIn, 64), calldataload(P_EVAL_B))
                mstore(add(mIn, 96), calldataload(P_EVAL_C))
                mstore(add(mIn, 128), calldataload(P_EVAL_S1))
                mstore(add(mIn, 160), calldataload(P_EVAL_S2))
                mstore(add(mIn, 192), calldataload(P_EVAL_ZW))

                let v1 := mod(keccak256(mIn, 224), q)
                mstore(add(pMem, P_V1), v1)

                // challenges.beta * challenges.xi
                mstore(add(pMem, P_BETA_XI), mulmod(beta, aux, q))

                // challenges.xi^n

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                aux := mulmod(aux, aux, q)

                mstore(add(pMem, P_XIN), aux)

                // Zh
                aux := mod(add(sub(aux, 1), q), q)
                mstore(add(pMem, P_ZH), aux)
                mstore(add(pMem, P_ZH_INV), aux) // We will invert later together with lagrange pols

                // challenges.v^2, challenges.v^3, challenges.v^4, challenges.v^5
                aux := mulmod(v1, v1, q)
                mstore(add(pMem, P_V2), aux)
                aux := mulmod(aux, v1, q)
                mstore(add(pMem, P_V3), aux)
                aux := mulmod(aux, v1, q)
                mstore(add(pMem, P_V4), aux)
                aux := mulmod(aux, v1, q)
                mstore(add(pMem, P_V5), aux)

                // challenges.u
                mstore(mIn, calldataload(P_WXI))
                mstore(add(mIn, 32), calldataload(add(P_WXI, 32)))
                mstore(add(mIn, 64), calldataload(P_WXIW))
                mstore(add(mIn, 96), calldataload(add(P_WXIW, 32)))

                mstore(add(pMem, P_U), mod(keccak256(mIn, 128), q))
            }

            function calculateLagrange(pMem) {
                let w := 1

                mstore(add(pMem, P_EVAL_L1), mulmod(n, mod(add(sub(mload(add(pMem, P_XI)), w), q), q), q))

                inverseArray(add(pMem, P_ZH_INV), 2)

                let zh := mload(add(pMem, P_ZH))
                w := 1

                mstore(add(pMem, P_EVAL_L1), mulmod(mload(add(pMem, P_EVAL_L1)), zh, q))
            }

            function calculatePI(pMem, pPub) {
                let pl := 0

                pl := mod(add(sub(pl, mulmod(mload(add(pMem, P_EVAL_L1)), calldataload(add(pPub, 0)), q)), q), q)

                mstore(add(pMem, P_PI), pl)
            }

            function calculateR0(pMem) {
                let e1 := mload(add(pMem, P_PI))

                let e2 := mulmod(mload(add(pMem, P_EVAL_L1)), mload(add(pMem, P_ALPHA2)), q)

                let e3a :=
                    addmod(calldataload(P_EVAL_A), mulmod(mload(add(pMem, P_BETA)), calldataload(P_EVAL_S1), q), q)
                e3a := addmod(e3a, mload(add(pMem, P_GAMMA)), q)

                let e3b :=
                    addmod(calldataload(P_EVAL_B), mulmod(mload(add(pMem, P_BETA)), calldataload(P_EVAL_S2), q), q)
                e3b := addmod(e3b, mload(add(pMem, P_GAMMA)), q)

                let e3c := addmod(calldataload(P_EVAL_C), mload(add(pMem, P_GAMMA)), q)

                let e3 := mulmod(mulmod(e3a, e3b, q), e3c, q)
                e3 := mulmod(e3, calldataload(P_EVAL_ZW), q)
                e3 := mulmod(e3, mload(add(pMem, P_ALPHA)), q)

                let r0 := addmod(e1, mod(sub(q, e2), q), q)
                r0 := addmod(r0, mod(sub(q, e3), q), q)

                mstore(add(pMem, P_EVAL_R0), r0)
            }

            function g1_set(pR, pP) {
                mstore(pR, mload(pP))
                mstore(add(pR, 32), mload(add(pP, 32)))
            }

            function g1_setC(pR, x, y) {
                mstore(pR, x)
                mstore(add(pR, 32), y)
            }

            function g1_calldataSet(pR, pP) {
                mstore(pR, calldataload(pP))
                mstore(add(pR, 32), calldataload(add(pP, 32)))
            }

            function g1_acc(pR, pP) {
                let mIn := mload(0x40)
                mstore(mIn, mload(pR))
                mstore(add(mIn, 32), mload(add(pR, 32)))
                mstore(add(mIn, 64), mload(pP))
                mstore(add(mIn, 96), mload(add(pP, 32)))

                let success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function g1_mulAcc(pR, pP, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, mload(pP))
                mstore(add(mIn, 32), mload(add(pP, 32)))
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function g1_mulSetC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function g1_mulSet(pR, pP, s) {
                g1_mulSetC(pR, mload(pP), mload(add(pP, 32)), s)
            }

            function calculateD(pMem) {
                let _pD := add(pMem, P_D)
                let gamma := mload(add(pMem, P_GAMMA))
                let mIn := mload(0x40)
                mstore(0x40, add(mIn, 256)) // d1, d2, d3 & d4 (4*64 bytes)

                g1_setC(_pD, Qcx, Qcy)
                g1_mulAccC(_pD, Qmx, Qmy, mulmod(calldataload(P_EVAL_A), calldataload(P_EVAL_B), q))
                g1_mulAccC(_pD, Qlx, Qly, calldataload(P_EVAL_A))
                g1_mulAccC(_pD, Qrx, Qry, calldataload(P_EVAL_B))
                g1_mulAccC(_pD, Qox, Qoy, calldataload(P_EVAL_C))

                let betaxi := mload(add(pMem, P_BETA_XI))
                let val1 := addmod(addmod(calldataload(P_EVAL_A), betaxi, q), gamma, q)

                let val2 := addmod(addmod(calldataload(P_EVAL_B), mulmod(betaxi, k1, q), q), gamma, q)

                let val3 := addmod(addmod(calldataload(P_EVAL_C), mulmod(betaxi, k2, q), q), gamma, q)

                let d2a := mulmod(mulmod(mulmod(val1, val2, q), val3, q), mload(add(pMem, P_ALPHA)), q)

                let d2b := mulmod(mload(add(pMem, P_EVAL_L1)), mload(add(pMem, P_ALPHA2)), q)

                // We'll use mIn to save d2
                g1_calldataSet(add(mIn, 192), P_Z)
                g1_mulSet(mIn, add(mIn, 192), addmod(addmod(d2a, d2b, q), mload(add(pMem, P_U)), q))

                val1 := addmod(
                    addmod(calldataload(P_EVAL_A), mulmod(mload(add(pMem, P_BETA)), calldataload(P_EVAL_S1), q), q),
                    gamma,
                    q
                )

                val2 := addmod(
                    addmod(calldataload(P_EVAL_B), mulmod(mload(add(pMem, P_BETA)), calldataload(P_EVAL_S2), q), q),
                    gamma,
                    q
                )

                val3 := mulmod(
                    mulmod(mload(add(pMem, P_ALPHA)), mload(add(pMem, P_BETA)), q),
                    calldataload(P_EVAL_ZW),
                    q
                )

                // We'll use mIn + 64 to save d3
                g1_mulSetC(add(mIn, 64), S3x, S3y, mulmod(mulmod(val1, val2, q), val3, q))

                // We'll use mIn + 128 to save d4
                g1_calldataSet(add(mIn, 128), P_T1)

                g1_mulAccC(add(mIn, 128), calldataload(P_T2), calldataload(add(P_T2, 32)), mload(add(pMem, P_XIN)))
                let xin2 := mulmod(mload(add(pMem, P_XIN)), mload(add(pMem, P_XIN)), q)
                g1_mulAccC(add(mIn, 128), calldataload(P_T3), calldataload(add(P_T3, 32)), xin2)

                g1_mulSetC(add(mIn, 128), mload(add(mIn, 128)), mload(add(mIn, 160)), mload(add(pMem, P_ZH)))

                mstore(add(add(mIn, 64), 32), mod(sub(qf, mload(add(add(mIn, 64), 32))), qf))
                mstore(add(mIn, 160), mod(sub(qf, mload(add(mIn, 160))), qf))
                g1_acc(_pD, mIn)
                g1_acc(_pD, add(mIn, 64))
                g1_acc(_pD, add(mIn, 128))
            }

            function calculateF(pMem) {
                let p := add(pMem, P_F)

                g1_set(p, add(pMem, P_D))
                g1_mulAccC(p, calldataload(P_A), calldataload(add(P_A, 32)), mload(add(pMem, P_V1)))
                g1_mulAccC(p, calldataload(P_B), calldataload(add(P_B, 32)), mload(add(pMem, P_V2)))
                g1_mulAccC(p, calldataload(P_C), calldataload(add(P_C, 32)), mload(add(pMem, P_V3)))
                g1_mulAccC(p, S1x, S1y, mload(add(pMem, P_V4)))
                g1_mulAccC(p, S2x, S2y, mload(add(pMem, P_V5)))
            }

            function calculateE(pMem) {
                let s := mod(sub(q, mload(add(pMem, P_EVAL_R0))), q)

                s := addmod(s, mulmod(calldataload(P_EVAL_A), mload(add(pMem, P_V1)), q), q)
                s := addmod(s, mulmod(calldataload(P_EVAL_B), mload(add(pMem, P_V2)), q), q)
                s := addmod(s, mulmod(calldataload(P_EVAL_C), mload(add(pMem, P_V3)), q), q)
                s := addmod(s, mulmod(calldataload(P_EVAL_S1), mload(add(pMem, P_V4)), q), q)
                s := addmod(s, mulmod(calldataload(P_EVAL_S2), mload(add(pMem, P_V5)), q), q)
                s := addmod(s, mulmod(calldataload(P_EVAL_ZW), mload(add(pMem, P_U)), q), q)

                g1_mulSetC(add(pMem, P_E), G1x, G1y, s)
            }

            function checkPairing(pMem) -> isOk {
                let mIn := mload(0x40)
                mstore(0x40, add(mIn, 576)) // [0..383] = pairing data, [384..447] = P_WXI, [448..512] = P_WXIW

                let _pWxi := add(mIn, 384)
                let _pWxiw := add(mIn, 448)
                let _aux := add(mIn, 512)

                g1_calldataSet(_pWxi, P_WXI)
                g1_calldataSet(_pWxiw, P_WXIW)

                // A1
                g1_mulSet(mIn, _pWxiw, mload(add(pMem, P_U)))
                g1_acc(mIn, _pWxi)
                mstore(add(mIn, 32), mod(sub(qf, mload(add(mIn, 32))), qf))

                // [X]_2
                mstore(add(mIn, 64), X2x2)
                mstore(add(mIn, 96), X2x1)
                mstore(add(mIn, 128), X2y2)
                mstore(add(mIn, 160), X2y1)

                // B1
                g1_mulSet(add(mIn, 192), _pWxi, mload(add(pMem, P_XI)))

                let s := mulmod(mload(add(pMem, P_U)), mload(add(pMem, P_XI)), q)
                s := mulmod(s, w1, q)
                g1_mulSet(_aux, _pWxiw, s)
                g1_acc(add(mIn, 192), _aux)
                g1_acc(add(mIn, 192), add(pMem, P_F))
                mstore(add(pMem, add(P_E, 32)), mod(sub(qf, mload(add(pMem, add(P_E, 32)))), qf))
                g1_acc(add(mIn, 192), add(pMem, P_E))

                // [1]_2
                mstore(add(mIn, 256), G2x2)
                mstore(add(mIn, 288), G2x1)
                mstore(add(mIn, 320), G2y2)
                mstore(add(mIn, 352), G2y1)

                let success := staticcall(sub(gas(), 2000), 8, mIn, 384, mIn, 0x20)

                isOk := and(success, mload(mIn))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, LAST_MEM))

            checkProofData()
            calculateChallenges(pMem, _pubSignals)
            calculateLagrange(pMem)
            calculatePI(pMem, _pubSignals)
            calculateR0(pMem)
            calculateD(pMem)
            calculateF(pMem)
            calculateE(pMem)
            let isValid := checkPairing(pMem)

            mstore(0x40, sub(pMem, LAST_MEM))
            mstore(0, isValid)
            return(0, 0x20)
        }
    }
}
