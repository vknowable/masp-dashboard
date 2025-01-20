extern crate thiserror;
extern crate wasm_bindgen;
use gloo_utils::format::JsValueSerdeExt;
use base64::decode;
use namada_sdk::{
    borsh::BorshDeserialize, masp::MaspTokenRewardData, token::Amount,
};
use serde::Serialize;
use thiserror::Error;
use wasm_bindgen::prelude::*;

type JsResult<T> = std::result::Result<T, JsError>;

#[derive(Debug, Error, PartialEq)]
pub enum WasmError {
    #[error("invalid base64 string")]
    DecodingError,

    #[error("unknown error")]
    UnknownError,
}

impl From<base64::DecodeError> for WasmError {
    fn from(_: base64::DecodeError) -> Self {
        WasmError::DecodingError
    }
}

impl From<std::io::Error> for WasmError {
    fn from(_: std::io::Error) -> Self {
        WasmError::UnknownError
    }
}

#[derive(Debug, Serialize)]
pub struct SerializableMaspTokenRewardData {
    pub name: String,
    pub address: String,
    pub max_reward_rate: String,
    pub kp_gain: String,
    pub kd_gain: String,
    pub locked_amount_target: u64,
}

impl From<MaspTokenRewardData> for SerializableMaspTokenRewardData {
    fn from(data: MaspTokenRewardData) -> Self {
        SerializableMaspTokenRewardData {
            name: data.name,
            address: data.address.to_string(),
            max_reward_rate: data.max_reward_rate.to_string(),
            kp_gain: data.kp_gain.to_string(),
            kd_gain: data.kd_gain.to_string(),
            locked_amount_target: data.locked_amount_target.as_u64(),
        }
    }
}

#[wasm_bindgen]
pub fn decode_amount(base64_str: &str) -> JsResult<JsValue> {
    let amount: Amount = decode_abci_value_str(base64_str)?;
    to_js_result(amount)
}

#[wasm_bindgen]
pub fn decode_reward_tokens(base64_str: &str) -> JsResult<JsValue> {
    let reward_tokens: Vec<MaspTokenRewardData> = decode_abci_value_str(base64_str)?;
    let serializable_tokens: Vec<SerializableMaspTokenRewardData> = 
        reward_tokens.into_iter().map(SerializableMaspTokenRewardData::from).collect();
    to_js_result(serializable_tokens)
}

fn decode_abci_value_str<T>(base64_str: &str) -> Result<T, WasmError>
where
    T: BorshDeserialize,
{
    let bytes = decode(base64_str)?;
    let value = T::try_from_slice(&bytes)?;
    Ok(value)
}

fn to_js_result<T>(result: T) -> Result<JsValue, JsError>
where
    T: Serialize,
{
    match JsValue::from_serde(&result) {
        Ok(v) => Ok(v),
        Err(e) => Err(JsError::new(&e.to_string())),
    }
}