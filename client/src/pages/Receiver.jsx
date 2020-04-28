import React, { useRef, useEffect, useState, useContext } from "react";
import {
  Navbar,
  Container,
  Alert,
  Row,
  Col,
  Button,
  Media,
  Badge,
  Image,
  Card
} from "react-bootstrap";
import Peer from "simple-peer";
import io from "socket.io-client";
import UserContext from "../contexts/UserContext";
import { useHistory } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhoneAlt } from "@fortawesome/free-solid-svg-icons";

const Receiver = () => {
  const user = useContext(UserContext);

  const [users, setUsers] = useState([]);
  const [userID, setUserID] = useState(null);
  const [socketID, setSocketID] = useState(null);
  const [signal, setSignal] = useState(null);
  // const [stream, setStream] = useState(null);
  const [caller, setCaller] = useState(null);

  const history = useHistory();
  const player = useRef(null);
  let socket = useRef(null);

  useEffect(() => {
    console.log(`Logged in as ${user.name}`);
    if (!user.name.length) {
      console.log("in clear");
      return history.push("/");
    }

    socket.current = io(":8000/", {
      query: {
        name: user.name,
        type: user.type
      }
    });

    console.log("Opening socket");
    socket.current.on("connected", ({ id, socketID }) => {
      console.log("User ID", id);
      console.log("Socket ID", id);
      setUserID(id);
      setSocketID(socketID);
      user.setUserID(id);
      user.setSocketID(socketID);
    });

    socket.current.on("users", res => {
      console.log(res);
      setUsers(res);
    });

    socket.current.on("get-signal", res => {
      console.log("Received signal: ", res.from);
      setSignal(res.signal);
      setCaller(res.from);
    });

    return () => {
      socket.current.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  const onAccept = caller => {
    const peer = new Peer({
      initiator: false,
      trickle: false
      // stream: stream
    });

    peer.on("signal", data => {
      socket.current.emit("acknowledge-call", {
        signal: data,
        from: {
          id: userID,
          name: user.name,
          type: user.type,
          socketID: socketID
        },
        to: caller
      });
    });

    peer.on("stream", stream => {
      player.current.srcObject = stream;
    });

    peer.signal(signal);
  };

  return (
    <>
      <Navbar bg="dark" expand="lg">
        <Navbar.Brand className="text-white">Talky: Receiver</Navbar.Brand>
      </Navbar>
      <Container className="my-5">
        <Alert variant="info">
          <Media>
            <Image
              rounded
              src={`https://api.adorable.io/avatars/285/${user.name}.png`}
              className="mr-3"
              width={70}
              height={70}
            />
            <Media.Body>
              <h6 className="mb-0">
                {user.name}
                <Badge variant="success" className="ml-2">
                  {user.type}
                </Badge>
              </h6>
              <p className="text-muted mb-0">
                <small>{userID}</small>
              </p>
              <p className="text-muted mb-0">
                <small>{socketID}</small>
              </p>
            </Media.Body>
          </Media>
        </Alert>

        <Row>
          <Col sm={12} md={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
            <video ref={player} autoPlay className="img-fluid" />
          </Col>
        </Row>

        {users.map(({ id, name, type, socketID: sID }) => {
          if (id === userID && sID === socketID) return null;
          return (
            <Card body key={id}>
              <Media>
                <Image
                  rounded
                  src={`https://api.adorable.io/avatars/285/${name}.png`}
                  className="mr-3"
                  width={70}
                  height={70}
                />
                <Media.Body>
                  <h6 className="mb-0">
                    {name}
                    <Badge variant="success" className="ml-2">
                      {type}
                    </Badge>
                  </h6>
                  <p className="text-muted mb-0">
                    <small>{userID}</small>
                  </p>
                  <p className="text-muted mb-0">
                    <small>{sID}</small>
                  </p>
                </Media.Body>

                {caller && caller.id === id && (
                  <Button
                    variant="success"
                    onClick={() => onAccept({ id, name, type, socketID: sID })}
                  >
                    <FontAwesomeIcon icon={faPhoneAlt} className="mr-2" />
                    Accept
                  </Button>
                )}
              </Media>
            </Card>
          );
        })}
      </Container>
    </>
  );
};

export default Receiver;
