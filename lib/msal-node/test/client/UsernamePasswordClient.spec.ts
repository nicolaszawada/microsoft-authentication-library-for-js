/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import {
    AADServerParamKeys,
    AuthenticationResult,
    Authority,
    AuthToken,
    BaseClient,
    ClientConfiguration,
    CommonUsernamePasswordRequest,
    Constants,
    GrantType,
    PasswordGrantConstants,
    ThrottlingConstants
} from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS
} from "../test_kit/StringConstants";
import { UsernamePasswordClient } from "../../src";
import { ClientTestUtils } from "./ClientTestUtils";

describe("Username Password unit tests", () => {
    let config: ClientConfiguration;

    beforeEach(async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
        if (config.systemOptions) {
            config.systemOptions.preventCorsPreflight = true;
        }
        // Set up required objects and mocked return values
        const decodedLibState = `{ "id": "testid", "ts": 1592846482 }`;
        config.cryptoInterface!.base64Decode = (input: string): string => {
            switch (input) {
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                case `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9`:
                    return decodedLibState;
                default:
                    return input;
            }
        };

        config.cryptoInterface!.base64Encode = (input: string): string => {
            switch (input) {
                case "123-test-uid":
                    return "MTIzLXRlc3QtdWlk";
                case "456-test-utid":
                    return "NDU2LXRlc3QtdXRpZA==";
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                default:
                    return input;
            }
        };

        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            preferred_username: "AbeLi@microsoft.com",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
    });


    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a UsernamePasswordClient", async () => {
            const client = new UsernamePasswordClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof UsernamePasswordClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    it("acquires a token", async () => {
        sinon.stub(UsernamePasswordClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_DEFAULT_SCOPES);

        const createTokenRequestBodySpy = sinon.spy(UsernamePasswordClient.prototype, <any>"createTokenRequestBody");

        const client = new UsernamePasswordClient(config);
        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: "mock_name",
            password: "mock_password",
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID
        };

        const authResult = await client.acquireToken(usernamePasswordRequest) as AuthenticationResult;
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token);
        expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token);
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.calledWith(usernamePasswordRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.GRANT_TYPE}=${encodeURIComponent(GrantType.RESOURCE_OWNER_PASSWORD_GRANT)}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${PasswordGrantConstants.username}=mock_name`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${PasswordGrantConstants.password}=mock_password`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.TOKEN_RESPONSE_TYPE}%20${Constants.ID_TOKEN_RESPONSE_TYPE}`)).toBe(true);
    });

    it("Adds tokenQueryParameters to the /token request", (done) => {
        sinon.stub(UsernamePasswordClient.prototype, <any>"executePostToTokenEndpoint").callsFake((url: string) => {
            try {
                expect(url.includes("/token?testParam1=testValue1&testParam3=testValue3")).toBeTruthy();
                expect(!url.includes("/token?testParam2=")).toBeTruthy();
                done();
            } catch (error) {
                done(error);
            }
        });

        const client = new UsernamePasswordClient(config);
        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: "mock_name",
            password: "mock_password",
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
            tokenQueryParameters: {
                testParam1: "testValue1",
                testParam2: "",
                testParam3: "testValue3",
            },
        };

        client.acquireToken(usernamePasswordRequest).catch(() => {
            // Catch errors thrown after the function call this test is testing
        });
    });

    it("properly encodes special characters in emails (usernames)", async () => {
        sinon.stub(UsernamePasswordClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_DEFAULT_SCOPES);

        const createTokenRequestBodySpy = sinon.spy(UsernamePasswordClient.prototype, <any>"createTokenRequestBody");

        const client = new UsernamePasswordClient(config);
        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: "mock+name",
            password: "mock_password",
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID
        };

        const authResult = await client.acquireToken(usernamePasswordRequest) as AuthenticationResult;
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token);
        expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token);
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.calledWith(usernamePasswordRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${PasswordGrantConstants.username}=mock%2Bname`)).toBe(true);
    });

    it("properly encodes special characters in passwords", async () => {
        sinon.stub(UsernamePasswordClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_DEFAULT_SCOPES);

        const createTokenRequestBodySpy = sinon.spy(UsernamePasswordClient.prototype, <any>"createTokenRequestBody");

        const client = new UsernamePasswordClient(config);
        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: "mock_name",
            password: "mock_password&+",
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID
        };

        const authResult = await client.acquireToken(usernamePasswordRequest) as AuthenticationResult;
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token);
        expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token);
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.calledWith(usernamePasswordRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${PasswordGrantConstants.password}=mock_password%26%2B`)).toBe(true);
    });


    it("Does not include claims if empty object is passed", async () => {
        sinon.stub(UsernamePasswordClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_DEFAULT_SCOPES);

        const createTokenRequestBodySpy = sinon.spy(UsernamePasswordClient.prototype, <any>"createTokenRequestBody");

        const client = new UsernamePasswordClient(config);
        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: "mock_name",
            password: "mock_password",
            correlationId: RANDOM_TEST_GUID,
            claims: "{}"
        };

        const authResult = await client.acquireToken(usernamePasswordRequest) as AuthenticationResult;
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token);
        expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token);
        expect(authResult.state).toBe("");

        expect(createTokenRequestBodySpy.calledWith(usernamePasswordRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.GRANT_TYPE}=${encodeURIComponent(GrantType.RESOURCE_OWNER_PASSWORD_GRANT)}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${PasswordGrantConstants.username}=mock_name`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${PasswordGrantConstants.password}=mock_password`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(false);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
    });
});
