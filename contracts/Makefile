# Self Protocol LayerZero Cross-Chain Makefile
# Simplified deployment and management for Celo Mainnet -> Base Mainnet

.PHONY: help install deploy deploy-contracts setup-peers fund-source verify-setup verify-contracts clean set-scope show-scope withdraw-source

# Default target
help:
	@echo "Self Protocol LayerZero Cross-Chain Deployment"
	@echo ""
	@echo "Available targets:"
	@echo "  deploy          - Full deployment with automatic peer setup"
	@echo "  deploy-contracts - Deploy contracts only (no peer setup)"
	@echo "  setup-peers     - Configure LayerZero peers (requires deployed contracts)"
	@echo "  fund-source     - Fund source contract for cross-chain gas (Usage: make fund-source AMOUNT=<CELO>, e.g., 0.5)"
	@echo "  verify-setup    - Verify deployment and peer configuration"
	@echo "  verify-contracts - Manually verify contracts on block explorers"
	@echo "  withdraw-source - Withdraw unused CELO from source contract (owner only)"
	@echo "  set-scope       - Compute + set correct scope on source contract"
	@echo "  show-scope      - Read current scope from source contract"
	@echo "  install         - Install dependencies"
	@echo "  clean           - Clean build artifacts"
	@echo ""
	@echo "Environment:"
	@echo "  Ensure .env is configured with PRIVATE_KEY, VERIFICATION_CONFIG_ID, and SCOPE_SEED"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install
	forge install

# Full deployment with automatic setup
deploy:
	@echo "🚀 Starting full LayerZero cross-chain deployment..."
	@if [ ! -f .env ]; then echo "❌ .env file not found. Copy .env.example to .env first."; exit 1; fi
	AUTO_SETUP_PEERS=true ./script/deploy-oapp-cross-chain.sh

# Deploy contracts only (no peer setup)
deploy-contracts:
	@echo "📋 Deploying contracts only..."
	@if [ ! -f .env ]; then echo "❌ .env file not found. Copy .env.example to .env first."; exit 1; fi
	AUTO_SETUP_PEERS=false ./script/deploy-oapp-cross-chain.sh

# Configure LayerZero peers (requires deployed contracts)
setup-peers:
	@echo "🔗 Setting up LayerZero peers..."
	@$(MAKE) _check-deployments
	@$(MAKE) _setup-peers-internal

# Fund source contract
fund-source:
	@if [ -z "$(AMOUNT)" ]; then \
		echo "❌ Please specify amount: make fund-source AMOUNT=<CELO> (e.g., 0.5)"; \
		echo "💡 Tip: Funding ~0.5 CELO helps ensure cross-chain delivery (covers DVN + executor fees)."; \
		exit 1; \
	fi
	@echo "💰 Funding source contract with $(AMOUNT) CELO..."
	@$(MAKE) _check-deployments
	@$(MAKE) _fund-source-internal AMOUNT=$(AMOUNT)

# Verify deployment and configuration
verify-setup:
	@echo "✅ Verifying deployment..."
	@$(MAKE) _check-deployments
	@$(MAKE) _verify-peers
	@$(MAKE) _verify-balance


# Clean build artifacts
clean:
	forge clean
	rm -rf cache/ out/ broadcast/

# Verify contracts manually (if auto-verification failed)
verify-contracts:
	@echo "🔍 Manually verifying contracts..."
	./script/verify-contracts.sh

# Internal targets (not meant to be called directly)
_check-deployments:
	@if [ ! -f .env ]; then echo "❌ .env file not found."; exit 1; fi
	@source .env && \
	CELO_BROADCAST="broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json" && \
	BASE_BROADCAST="broadcast/DeployProofOfHumanReceiver.s.sol/8453/run-latest.json" && \
	if [ ! -f "$$CELO_BROADCAST" ] || [ ! -f "$$BASE_BROADCAST" ]; then \
		echo "❌ Deployment artifacts not found. Run 'make deploy-contracts' first."; \
		exit 1; \
	fi

_setup-peers-internal:
	@source .env && \
	SOURCE_ADDR=$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanOApp") | .contractAddress' broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json | head -1) && \
	DEST_ADDR=$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanReceiver") | .contractAddress' broadcast/DeployProofOfHumanReceiver.s.sol/8453/run-latest.json | head -1) && \
	echo "Setting peers: $$SOURCE_ADDR <-> $$DEST_ADDR" && \
	SOURCE_EID=$${SOURCE_EID:-30125} && \
	DESTINATION_EID=$${DESTINATION_EID:-30184} && \
	echo "Setting destination as peer on Celo Mainnet..." && \
	cast send $$SOURCE_ADDR "setPeer(uint32,bytes32)" $$DESTINATION_EID $$(cast --to-bytes32 $$DEST_ADDR) --rpc-url https://forno.celo.org --private-key $$PRIVATE_KEY && \
	echo "Setting Celo Mainnet as peer on destination..." && \
	cast send $$DEST_ADDR "setPeer(uint32,bytes32)" $$SOURCE_EID $$(cast --to-bytes32 $$SOURCE_ADDR) --rpc-url https://mainnet.base.org --private-key $$PRIVATE_KEY && \
	echo "✅ Peers configured successfully!"

_fund-source-internal:
	@source .env && \
	SOURCE_ADDR=$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanOApp") | .contractAddress' broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json | head -1) && \
	echo "Funding $$SOURCE_ADDR with $(AMOUNT) CELO..." && \
	cast send $$SOURCE_ADDR --value "$(AMOUNT)ether" --rpc-url https://forno.celo.org --private-key $$PRIVATE_KEY && \
	echo "✅ Source contract funded!"

_verify-peers:
	@source .env && \
	SOURCE_ADDR=$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanOApp") | .contractAddress' broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json | head -1) && \
	DEST_ADDR=$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanReceiver") | .contractAddress' broadcast/DeployProofOfHumanReceiver.s.sol/8453/run-latest.json | head -1) && \
	echo "Verifying peer configuration..." && \
	SOURCE_EID=$${SOURCE_EID:-30125} && \
	DESTINATION_EID=$${DESTINATION_EID:-30184} && \
	SOURCE_PEER=$$(cast call $$SOURCE_ADDR "peers(uint32)" $$DESTINATION_EID --rpc-url https://forno.celo.org) && \
	DEST_PEER=$$(cast call $$DEST_ADDR "peers(uint32)" $$SOURCE_EID --rpc-url https://mainnet.base.org) && \
	EXPECTED_DEST=$$(cast --to-bytes32 $$DEST_ADDR) && \
	EXPECTED_SOURCE=$$(cast --to-bytes32 $$SOURCE_ADDR) && \
	if [ "$$SOURCE_PEER" = "$$EXPECTED_DEST" ] && [ "$$DEST_PEER" = "$$EXPECTED_SOURCE" ]; then \
		echo "✅ Peer configuration verified!"; \
	else \
		echo "❌ Peer configuration mismatch"; \
		echo "Source peer: $$SOURCE_PEER (expected: $$EXPECTED_DEST)"; \
		echo "Dest peer: $$DEST_PEER (expected: $$EXPECTED_SOURCE)"; \
		exit 1; \
	fi

_verify-balance:
	@source .env && \
	SOURCE_ADDR=$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanOApp") | .contractAddress' broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json | head -1) && \
	BALANCE=$$(cast balance $$SOURCE_ADDR --rpc-url https://forno.celo.org) && \
	echo "Source contract balance: $$BALANCE wei ($$(cast --from-wei $$BALANCE) CELO)"




# Set correct scope using SCOPE_SEED and deployed source address
set-scope:
	@echo "🔐 Setting correct scope on source contract..."
	@if [ ! -f .env ]; then echo "❌ .env file not found."; exit 1; fi
	@source .env && \
	SOURCE_ADDR=$${SOURCE_ADDR_OVERRIDE:-$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanOApp") | .contractAddress' broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json | head -1)} && \
	if [ -z "$$SOURCE_ADDR" ] || [ "$$SOURCE_ADDR" = "null" ]; then echo "❌ Could not find source contract address"; exit 1; fi; \
	if [ -z "$$SCOPE_SEED" ]; then echo "❌ SCOPE_SEED is not set in .env"; exit 1; fi; \
		CHECKSUM_ADDR=$$(cast --to-checksum-address $$SOURCE_ADDR) && \
		SCOPE_VALUE=$$(SOURCE_ADDR=$$CHECKSUM_ADDR SCOPE_SEED=$$SCOPE_SEED node -e "const core=require('@selfxyz/core');const fn=core.hashEndpointWithScope||(core.default&&core.default.hashEndpointWithScope);if(!fn){process.exit(1)};console.log(fn(process.env.SOURCE_ADDR,process.env.SCOPE_SEED));") && \
	if [ -z "$$SCOPE_VALUE" ]; then echo "❌ Failed to compute scope"; exit 1; fi; \
		echo "Setting scope $$SCOPE_VALUE on $$CHECKSUM_ADDR..."; \
		cast send $$CHECKSUM_ADDR "setScope(uint256)" $$SCOPE_VALUE --rpc-url https://forno.celo.org --private-key $$PRIVATE_KEY && \
	echo "✅ Scope set to $$SCOPE_VALUE"

# Show current scope on source contract
show-scope:
	@echo "🔎 Reading current scope from source contract..."
	@if [ ! -f .env ]; then echo "❌ .env file not found."; exit 1; fi
	@source .env && \
	SOURCE_ADDR=$${SOURCE_ADDR_OVERRIDE:-$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanOApp") | .contractAddress' broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json | head -1)} && \
	if [ -z "$$SOURCE_ADDR" ] || [ "$$SOURCE_ADDR" = "null" ]; then echo "❌ Could not find source contract address"; exit 1; fi; \
	SCOPE_HEX=$$(cast call $$SOURCE_ADDR "scope()" --rpc-url https://forno.celo.org) && \
	SCOPE_DEC=$$(SCOPE_HEX=$$SCOPE_HEX node -e "console.log(BigInt(process.env.SCOPE_HEX).toString(10))") && \
	echo "Current scope on $$SOURCE_ADDR:" && \
	echo "  Hex: $$SCOPE_HEX" && \
	echo "  Dec: $$SCOPE_DEC"

# Withdraw unused native balance from the source contract (owner only)
withdraw-source:
	@echo "🏦 Withdrawing unused CELO from source contract..."
	@if [ ! -f .env ]; then echo "❌ .env file not found."; exit 1; fi
	@source .env && \
	SOURCE_ADDR=$${SOURCE_ADDR_OVERRIDE:-$$(jq -r '.transactions[] | select(.contractName == "ProofOfHumanOApp") | .contractAddress' broadcast/DeployProofOfHumanOApp.s.sol/42220/run-latest.json | head -1)} && \
	if [ -z "$$SOURCE_ADDR" ] || [ "$$SOURCE_ADDR" = "null" ]; then echo "❌ Could not find source contract address"; exit 1; fi; \
	BAL_BEFORE=$$(cast balance $$SOURCE_ADDR --rpc-url https://forno.celo.org) && \
	echo "Source balance before: $$BAL_BEFORE wei ($$(cast --from-wei $$BAL_BEFORE) CELO)" && \
	cast send $$SOURCE_ADDR "withdraw()" --rpc-url https://forno.celo.org --private-key $$PRIVATE_KEY && \
	BAL_AFTER=$$(cast balance $$SOURCE_ADDR --rpc-url https://forno.celo.org) && \
	echo "Source balance after:  $$BAL_AFTER wei ($$(cast --from-wei $$BAL_AFTER) CELO)" && \
	echo "✅ Withdraw completed (funds sent to owner)"
