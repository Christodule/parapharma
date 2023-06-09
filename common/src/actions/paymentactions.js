import {
    FETCH_PAYMENT_METHODS,
    FETCH_PAYMENT_METHODS_SUCCESS,
    FETCH_PAYMENT_METHODS_FAILED,
    UPDATE_WALLET_BALANCE,
    UPDATE_WALLET_BALANCE_SUCCESS,
    UPDATE_WALLET_BALANCE_FAILED,
    CLEAR_PAYMENT_MESSAGES
} from "../store/types";
import { RequestPushMsg } from '../other/NotificationFunctions';
import { firebase } from '../config/configureFirebase';
import store from '../store/store';

export const fetchPaymentMethods = () => (dispatch) => {
   
    const {
        config
    } = firebase;
 
    dispatch({
        type: FETCH_PAYMENT_METHODS,
        payload: null,
    });
    //need
    const settings = store.getState().settingsdata.settings;
    let host = window && window.location && settings.CompanyWebsite === window.location.origin? window.location.origin : `https://${config.projectId}.web.app`
    let url = `${host}/get_providers`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.length > 0) {
                dispatch({
                    type: FETCH_PAYMENT_METHODS_SUCCESS,
                    payload: responseJson,
                });
            }else{
                dispatch({
                    type: FETCH_PAYMENT_METHODS_FAILED,
                    payload: store.getState().languagedata.defaultLanguage.no_provider_found,
                });
            }
        })
        .catch((error) => {
            dispatch({
                type: FETCH_PAYMENT_METHODS_FAILED,
                payload: store.getState().languagedata.defaultLanguage.provider_fetch_error + ": " + error.toString(),
            });
        });
};

export const clearMessage = () => (dispatch) => {
    dispatch({
        type: CLEAR_PAYMENT_MESSAGES,
        payload: null,
    });    
};


export const addToWallet = (uid, amount) => async (dispatch) => {
    const {
        walletHistoryRef,
        singleUserRef,
        settingsRef
    } = firebase;

    dispatch({
        type: UPDATE_WALLET_BALANCE,
        payload: null
    });

    const settingsdata = await settingsRef.once("value");
    const settings = settingsdata.val();

    singleUserRef(uid).once("value", snapshot => {
        if (snapshot.val()) {
            let walletBalance = parseFloat(snapshot.val().walletBalance);
            walletBalance = parseFloat((parseFloat(walletBalance) + parseFloat(amount)).toFixed(settings.decimal));
            let details = {
                type: 'Credit',
                amount: parseFloat(amount),
                date: new Date().getTime(),
                txRef: 'AdminCredit'
            }
            singleUserRef(uid).update({walletBalance: walletBalance}).then(() => {
                walletHistoryRef(uid).push(details).then(()=>{
                    dispatch({
                        type: UPDATE_WALLET_BALANCE_SUCCESS,
                        payload: null
                    });
                }).catch(error=>{
                    dispatch({
                        type: UPDATE_WALLET_BALANCE_FAILED,
                        payload: error.code + ": " + error.message,
                    });            
                })
                RequestPushMsg(
                    snapshot.val().pushToken,
                    {
                        title: store.getState().languagedata.defaultLanguage.notification_title,
                        msg:  store.getState().languagedata.defaultLanguage.wallet_updated,
                        screen: 'Wallet'
                    });
            }).catch(error=>{
                dispatch({
                    type: UPDATE_WALLET_BALANCE_FAILED,
                    payload: error.code + ": " + error.message,
                });
            });
            
        }
    });
};


export const updateWalletBalance = (balance, details) => async (dispatch) => {

    const {
        walletHistoryRef,
        auth,
        singleUserRef,
        withdrawRef,
        settingsRef
    } = firebase;
    
    let uid = auth.currentUser.uid;
    dispatch({
        type: UPDATE_WALLET_BALANCE,
        payload: null
    });

    const settingsdata = await settingsRef.once("value");
    const settings = settingsdata.val();
    singleUserRef(uid).update({walletBalance: parseFloat(parseFloat(balance).toFixed(settings.decimal))}).then(() => {
        walletHistoryRef(uid).push(details).then(()=>{
            singleUserRef(uid).once("value", snapshot => {
                if (snapshot.val()) {
                    let profile = snapshot.val();

                    RequestPushMsg(
                        snapshot.val().pushToken,
                        {
                            title: store.getState().languagedata.defaultLanguage.notification_title,
                            msg:store.getState().languagedata.defaultLanguage.wallet_updated,
                            screen: 'Wallet'
                        });

                    if(details.type == 'Withdraw'){
                        withdrawRef.push({
                            uid : uid,
                            name : profile.firstName +  ' ' + profile.lastName,
                            amount : parseFloat(details.amount),
                            date : details.date,
                            bankName : profile.bankName? profile.bankName : '',
                            bankCode : profile.bankCode? profile.bankCode : '',
                            bankAccount : profile.bankAccount? profile.bankAccount : '',
                            processed:false
                        });
                    }
                }
            }); 
        }).catch(error=>{
            dispatch({
                type: UPDATE_WALLET_BALANCE_FAILED,
                payload: error.code + ": " + error.message,
            });            
        })
    }).catch(error=>{
        dispatch({
            type: UPDATE_WALLET_BALANCE_FAILED,
            payload: error.code + ": " + error.message,
        });
    });
};
