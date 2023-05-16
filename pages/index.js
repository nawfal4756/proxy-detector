import axios from "axios";
import { DateTime } from "luxon";
import Head from "next/head";
import { useEffect, useState } from "react";
import requestIp from "request-ip";

export default function Home({ ip, headerKeys, apiData }) {
  const [ipArray, setIpArray] = useState([""]);
  const [reqData, setReqData] = useState({});
  const [webrtcCheck, setWebrtcCheck] = useState(false);
  const [headerCheck, setHeaderCheck] = useState(false);
  const [timezoneCheck, setTimezoneCheck] = useState(false);
  const [datacenterCheck, setDatacenterCheck] = useState(false);
  const [ipCheck, setIpCheck] = useState(false);

  useEffect(() => {
    let ips = [];
    async function find_public_IP() {
      //RTCPeerConnection will establish a connection between local and remote host and then returns the connection variable
      var my_RTC_Peer_Connection =
        window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection;
      var peer_connection = new my_RTC_Peer_Connection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        }), //configurations of peer_connection
        noop = function () {},
        local_IP_arr = {},
        ip_regex =
          /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
        key;

      function find_ip_locally(ip) {
        if (!local_IP_arr[ip]) {
          setIpArray((ipArray) => [...ipArray, ip]);
          ips.push(ip);
        }
        local_IP_arr[ip] = true;
      }

      peer_connection.createDataChannel(""); //create a channel of communication between local and remote host for data transfer

      peer_connection.createOffer(function (sdp) {
        sdp.sdp.split("\n").forEach(function (line) {
          if (line.indexOf("candidate") < 0) return;
          line.match(ip_regex).forEach(find_ip_locally);
        });
        peer_connection.setLocalDescription(sdp, noop, noop);
      }, noop);

      peer_connection.onicecandidate = function (ice) {
        //event handler
        if (
          !ice ||
          !ice.candidate ||
          !ice.candidate.candidate ||
          !ice.candidate.candidate.match(ip_regex)
        )
          return;
        ice.candidate.candidate.match(ip_regex).forEach(find_ip_locally);
      };
    }

    async function requestIpData() {
      const data = await axios.get(`https://api.incolumitas.com/?q=${ip}`);
      setReqData(data.data);
      let dataStored = data.data;
      if (
        !dataStored.is_datacenter &&
        !dataStored.is_vpn &&
        !dataStored.is_tor &&
        !dataStored.is_proxy
      ) {
        setDatacenterCheck(true);
      }
    }

    async function checkTimezone() {
      const localTime = DateTime.now();
      if (apiData.time_zone.name == localTime.zoneName) {
        setTimezoneCheck(true);
      }     
    }

    function checkHeaders() {
      const blackListedHeader = [
        "x-forwarded-for",
        "x-client-ip",
        "x-real-ip",
        "x-forwarded",
        "x-cluster-client-ip",
        "forwarded-for",
        "forwarded",
        "via",
        "x-forwarded-host",
        "x-forwarded-proto",
        "forwarded-proto",
        "x-forwarded-protocol",
        "x-http-forwarded-for",
        "http-forwarded-for",
        "x-http-forwarded",
        "http-forwarded",
        "x-http-via",
        "http-via",
        "x-proxy-user",
        "proxy-user",
        "x-remote-ip",
        "remote-ip",
        "x-remote-addr",
        "remote-addr",
        "x-true-client-ip",
        "true-client-ip",
        "cf-connecting-ip",
        "true-client-ip",
        "x-client-ip",
        "x-real-ip",
        "x-cluster-client-ip",
        "x-forwarded-for",
        "forwarded-for",
        "x-forwarded",
        "forwarded",
        "via",
        "x-forwarded-host",
        "x-forwarded-proto",
        "forwarded-proto",
        "x-forwarded-protocol",
        "x-http-forwarded-for",
        "http-forwarded-for",
        "x-http-forwarded",
        "http-forwarded",
        "x-http-via",
        "http-via",
        "x-proxy-user",
        "proxy-user",
        "x-remote-ip",
        "remote-ip",
        "x-remote-addr",
        "remote-addr",
        "x-true-client-ip",
        "true-client-ip",
        "cf-connecting-ip",
      ];
      headerKeys.map((value) => {
        if (blackListedHeader.includes(value.toString().trim().toLowerCase())) {
          setHeaderCheck(true);
        }
      });
    }

    checkHeaders();
    find_public_IP();
    requestIpData();
    checkTimezone();
  }, [ip, headerKeys, apiData]);

  useEffect(() => {
    ipArray.map((value) => {
      if (value.toString().trim().includes(ip.trim().toString().trim())) {
        setWebrtcCheck(true);
      }
    });
  }, [ip, ipArray]);

  useEffect(() => {
    if (!headerCheck || !webrtcCheck || !timezoneCheck || !datacenterCheck) {
      setIpCheck(false);
    }
    if (headerCheck && webrtcCheck && timezoneCheck && datacenterCheck) {
      setIpCheck(true);
    }
  }, [headerCheck, webrtcCheck, timezoneCheck, datacenterCheck]);

  return (
    <div>
      <Head>
        <title>Proxy Detector</title>
        <meta
          name="description"
          content="Detects proxies using multiple methods"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!ipCheck ? (
        <div className="vh-100">
          <div className="container h-100">
            <div className="row d-flex align-items-center justify-content-center mt-4">
              <div className="col-sm-12">
                <div className="alert alert-danger" role="alert">
                  <h4 className="alert-heading">Proxy Detected</h4>
                  <p>Proxy has been detected using the following methods:</p>
                  <hr />
                  <p className="mb-0">
                    {!datacenterCheck ? (
                      <li>
                        <b>Datacenter IP</b>
                      </li>
                    ) : (
                      ""
                    )}
                    {!timezoneCheck ? (
                      <li>
                        <b>Timezone Mismatch</b>
                      </li>
                    ) : (
                      ""
                    )}
                    {!webrtcCheck ? (
                      <li>
                        <b>WebRTC Leak</b>
                      </li>
                    ) : (
                      ""
                    )}
                    {!headerCheck ? (
                      <li>
                        <b>Header Check</b>
                      </li>
                    ) : (
                      ""
                    )}
                  </p>
                </div>
              </div>
              <div className="col-sm-12">
                <button className="btn btn-secondary" onClick={() => {setIpCheck(!ipCheck)}}>View Stats</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <nav className="navbar navbar-expand-sm navbar-light bg-light">
            <div className="container">
              <a className="navbar-brand" href="#">
                Navbar
              </a>
              <button
                className="navbar-toggler d-lg-none"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapsibleNavId"
                aria-controls="collapsibleNavId"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="collapsibleNavId">
                <ul className="navbar-nav me-auto mt-2 mt-lg-0">
                  <li className="nav-item">
                    <a className="nav-link active" href="#" aria-current="page">
                      Home <span className="visually-hidden">(current)</span>
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">
                      Link
                    </a>
                  </li>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="dropdownId"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      Dropdown
                    </a>
                    <div className="dropdown-menu" aria-labelledby="dropdownId">
                      <a className="dropdown-item" href="#">
                        Action 1
                      </a>
                      <a className="dropdown-item" href="#">
                        Action 2
                      </a>
                    </div>
                  </li>
                </ul>
                <form className="d-flex my-2 my-lg-0">
                  <input
                    className="form-control me-sm-2"
                    type="text"
                    placeholder="Search"
                  />
                  <button
                    className="btn btn-outline-success my-2 my-sm-0"
                    type="submit"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
          </nav>

          <div className="container">
            <div className="row">
              <div className="col-sm-12">
                <h1 className="text-center my-4">Proxy Detector</h1>
              </div>
            </div>
            <div className="row d-flex justify-content-evenly">
              <div className="col-sm-12 col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">IP Address</h4>
                    <p className="card-text">{ip}</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-12 col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">Headers Check</h4>
                    <p className="card-text">
                      Status: {headerCheck ? "True" : "False"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm-12 col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">Timezone Check</h4>
                    <p className="card-text">
                      Status: {timezoneCheck ? "True" : "False"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm-12 col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">IP Address Check</h4>
                    <p className="card-text">
                      Includes: Datacenter, VPN, TOR, Proxy
                    </p>
                    <p className="card-text">
                      Status: {datacenterCheck ? "True" : "False"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm-12 col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">WebRTC IP Check</h4>
                    <p className="card-text">Array: {ipArray.join(", ")}</p>
                    <p className="card-text">
                      Status: {webrtcCheck ? "True" : "False"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  const ip = requestIp.getClientIp(req);
  const headers = req.headers;
  let headerKeys = Object.keys(headers);
  let data = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.API_KEY}&ip=103.86.55.11`)

  return {
    props: {
      ip,
      headerKeys,
      apiData: data.data,
    },
  };
}
