/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity, AccountEntity, AppMetadataEntity, CacheManager, ICrypto, IdTokenEntity, RefreshTokenEntity } from "../../src";
import { MockStorageClass } from "../client/ClientTestUtils";
import { TEST_POP_VALUES } from "../test_kit/StringConstants";

export class MockCache {
    cacheManager: MockStorageClass;

    constructor(clientId: string, cryptoImpl: ICrypto) {
        this.cacheManager = new MockStorageClass(clientId, cryptoImpl);
    }

    // initialize the cache
    initializeCache(): void {
        this.createAccountEntries();
        this.createIdTokenEntries();
        this.createAccessTokenEntries();
        this.createRefreshTokenEntries();
        this.createAppMetadataEntries();
    }

    // clear the cache
    async clearCache(): Promise<void> {
        await this.cacheManager.clear();
    }

    // create account entries in the cache
    createAccountEntries(): void {
        const accountData = {
            "username": "John Doe",
            "localAccountId": "object1234",
            "realm": "microsoft",
            "environment": "login.microsoftonline.com",
            "homeAccountId": "uid.utid",
            "authorityType": "MSSTS",
            "clientInfo": "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ=="
        };
        const account = CacheManager.toObject(new AccountEntity(), accountData);

        this.cacheManager.setAccount(account);
    }

    // create id token entries in the cache
    createIdTokenEntries(): void {
        const idTokenData = {
            "realm": "microsoft",
            "environment": "login.microsoftonline.com",
            "credentialType": "IdToken",
            "secret": "header.eyJvaWQiOiAib2JqZWN0MTIzNCIsICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAiSm9obiBEb2UiLCAic3ViIjogInN1YiJ9.signature",
            "clientId": "mock_client_id",
            "homeAccountId": "uid.utid"
        };
        const idToken = CacheManager.toObject(new IdTokenEntity(), idTokenData);
        this.cacheManager.setIdTokenCredential(idToken);
    }

    // create access token entries in the cache
    createAccessTokenEntries(): void {
        const atOneData = {
            "environment": "login.microsoftonline.com",
            "credentialType": "AccessToken",
            "secret": "an access token",
            "realm": "microsoft",
            "target": "scope1 scope2 scope3",
            "clientId": "mock_client_id",
            "cachedAt": "1000",
            "homeAccountId": "uid.utid",
            "extendedExpiresOn": "4600",
            "expiresOn": "4600",
            "tokenType": "Bearer"
        };
        const atOne = CacheManager.toObject(new AccessTokenEntity(), atOneData);
        this.cacheManager.setAccessTokenCredential(atOne);

        const atTwoData = {
            "environment": "login.microsoftonline.com",
            "credentialType": "AccessToken",
            "secret": "an access token",
            "realm": "microsoft",
            "target": "scope4 scope5",
            "clientId": "mock_client_id",
            "cachedAt": "1000",
            "homeAccountId": "uid.utid",
            "extendedExpiresOn": "4600",
            "expiresOn": "4600",
            "tokenType": "Bearer"
        };
        const atTwo = CacheManager.toObject(new AccessTokenEntity(), atTwoData);
        this.cacheManager.setAccessTokenCredential(atTwo);

        const atWithAuthSchemeData = {
            "environment": "login.microsoftonline.com",
            "credentialType": "AccessToken_With_AuthScheme",
            "secret": "an access token",
            "realm": "microsoft",
            "target": "scope1 scope2 scope3",
            "clientId": "mock_client_id",
            "cachedAt": "1000",
            "homeAccountId": "uid.utid",
            "extendedExpiresOn": "4600",
            "expiresOn": "4600",
            "tokenType": "pop",
            "keyId": "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y"
        };
        const atWithAuthScheme = CacheManager.toObject(new AccessTokenEntity(), atWithAuthSchemeData);
        this.cacheManager.setAccessTokenCredential(atWithAuthScheme);
    }

    // create refresh token entries in the cache
    createRefreshTokenEntries(): void {
        const rtData = {
            "environment": "login.microsoftonline.com",
            "credentialType": "RefreshToken",
            "secret": "a refresh token",
            "clientId": "mock_client_id",
            "homeAccountId": "uid.utid"
        };
        const rt = CacheManager.toObject(new RefreshTokenEntity(), rtData);
        this.cacheManager.setRefreshTokenCredential(rt);

        const rtWithAuthSchemeData = {
            "environment": "login.microsoftonline.com",
            "credentialType": "RefreshToken_With_AuthScheme",
            "secret": "a refresh token",
            "clientId": "mock_client_id",
            "homeAccountId": "uid.utid",
            "tokenType": "pop",
            "stkKid": TEST_POP_VALUES.KID,
            "skKid": TEST_POP_VALUES.KID
        };
        const rtWithAuthScheme = CacheManager.toObject(new RefreshTokenEntity(), rtWithAuthSchemeData);
        this.cacheManager.setRefreshTokenCredential(rtWithAuthScheme);

        const rtFociData = {
            "environment": "login.microsoftonline.com",
            "credentialType": "RefreshToken",
            "secret": "a refresh token",
            "clientId": "mock_client_id_1",
            "homeAccountId": "uid.utid",
            "familyId": "1"
        };
        const rtFoci = CacheManager.toObject(new RefreshTokenEntity(), rtFociData);
        this.cacheManager.setRefreshTokenCredential(rtFoci);

        const rtFociWithAuthSchemeData = {
            "environment": "login.microsoftonline.com",
            "credentialType": "RefreshToken_With_AuthScheme",
            "secret": "a refresh token",
            "clientId": "mock_client_id",
            "homeAccountId": "uid.utid",
            "tokenType": "pop",
            "stkKid": TEST_POP_VALUES.KID,
            "skKid": TEST_POP_VALUES.KID,
            "familyId": "1"
        };
        const rtFociWithAuthScheme = CacheManager.toObject(new RefreshTokenEntity(), rtFociWithAuthSchemeData);
        this.cacheManager.setRefreshTokenCredential(rtFociWithAuthScheme);
    }

    // create appMetadata entries
    createAppMetadataEntries(): void {
        const appMetaData_data = {
            "environment": "login.microsoftonline.com",
            "familyId": "1",
            "clientId": "mock_client_id_1"
        };
        const appMetaData = CacheManager.toObject(new AppMetadataEntity(), appMetaData_data);
        this.cacheManager.setAppMetadata(appMetaData);
    }
}
