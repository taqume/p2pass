# Contracts

The contracts target Solidity `0.8.24` and OpenZeppelin Contracts `5.2.0`.

Deployment order is handled by `script/Deploy.s.sol`:

1. `EventPass`
2. `P2PassCore`
3. grant `EventPass.MINTER_ROLE` to `P2PassCore`
4. `P2PassReputation`, pointed at the immutable core address

The deployer remains the `EventPass` role admin and `P2PassCore` owner. Use a controlled operations wallet for production-like deployments. No private key is read by the frontend or committed to the repository.

