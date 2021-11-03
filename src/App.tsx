import { useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  setDoc,
} from "@firebase/firestore";
import { initializeApp, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import {
  Typography,
  Box,
  Grid,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Checkbox,
  Paper,
  TableRow,
  TableHead,
  TableContainer,
  TableCell,
  TableBody,
  Table,
} from "@mui/material";
import axios from "axios";

interface Applicant {
  firstName: string;
  lastName: string;
  email: string;
  firstHack: string;
  priorExperience: string;
  whyThisHackathon: string;
}
interface SelectedApplicants {
  [key: string]: boolean;
}
function App() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selected, setSelected] = useState<SelectedApplicants>({});
  const [passwordPopup, setPasswordPopup] = useState(true);
  const [password, setPassword] = useState("");

  const firebaseApp = initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  });
  if (process.env.REACT_APP_FIREBASE_APP_CHECK_PUBLIC_KEY) {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(
        process.env.REACT_APP_FIREBASE_APP_CHECK_PUBLIC_KEY
      ),
      isTokenAutoRefreshEnabled: true,
    });
  }

  const app = getApp();
  const db = getFirestore(app);
  const auth = getAuth(firebaseApp);

  async function handleChange(status: string) {
    const arr = Object.keys(selected).filter((k: string) => selected[k]);
    const userDocs = await getDocs(collection(db, "users"));
    let insert = {};
    if (status === "accepted") {
      insert = { accepted: true };
    } else {
      insert = { rejected: true };
    }
    if (userDocs) {
      userDocs.docs.forEach(async (user) => {
        if (arr.includes(user.data().email)) {
          await setDoc(doc(db, "users", user.id), insert, {
            merge: true,
          });
        }
      });
    }
    axios
      .post("/.netlify/functions/email", {
        emails: JSON.stringify(arr),
        messageType: status,
      })
      .catch((e: any) => {
        alert(e);
      });
    setApplicants(
      applicants.filter((obj) => {
        return !arr.includes(obj.email);
      })
    );
  }

  return (
    <>
      {!passwordPopup ? (
        <>
          <Grid container>
            <Grid item xs={12}>
              <Box p={1}>
                <Typography variant="h3">
                  Hackathon ATS - Undecided Applicants
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>First name</TableCell>
                  <TableCell>Last name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>First hackathon?</TableCell>
                  <TableCell>Prior experience?</TableCell>
                  <TableCell>Why this hackathon?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applicants.map((applicant) => (
                  <TableRow
                    key={applicant.email}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        id={applicant.email}
                        color="primary"
                        onChange={(e) => {
                          setSelected({
                            ...selected,
                            [e.target.id]: !selected[e.target.id],
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>{applicant.firstName}</TableCell>
                    <TableCell>{applicant.lastName}</TableCell>
                    <TableCell>{applicant.email}</TableCell>
                    <TableCell>{applicant.firstHack}</TableCell>
                    <TableCell>{applicant.priorExperience}</TableCell>
                    <TableCell>{applicant.whyThisHackathon}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Grid container direction="column" alignItems="center">
            <Box pt={2}>
              <Typography variant="h4">
                WARNING: These actions cannot be undone!
              </Typography>
            </Box>
            <Grid item xs={6}>
              <Box pt={2}>
                <Button
                  onClick={() => {
                    handleChange("accepted");
                  }}
                >
                  Accept selected
                </Button>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box pt={2}>
                <Button
                  onClick={() => {
                    handleChange("rejected");
                  }}
                >
                  Reject selected
                </Button>
              </Box>
            </Grid>
          </Grid>
        </>
      ) : (
        <Dialog
          open={passwordPopup}
          onClose={() => {
            setPasswordPopup(false);
          }}
        >
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="standard"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={async () => {
                if (
                  process.env.REACT_APP_EMAIL &&
                  process.env.REACT_APP_PWD &&
                  password === process.env.REACT_APP_PWD
                ) {
                  await signInWithEmailAndPassword(
                    auth,
                    process.env.REACT_APP_EMAIL,
                    process.env.REACT_APP_PWD
                  );
                  const userDocs = await getDocs(collection(db, "users")).catch(
                    (e) => {
                      alert(e);
                    }
                  );
                  if (userDocs) {
                    userDocs.docs.forEach(async (user) => {
                      if (!user.data().accepted && !user.data().rejected) {
                        user.data().id = user.data().email;
                        const currApplicant: Applicant = {
                          firstName: user.data().firstName,
                          lastName: user.data().lastName,
                          email: user.data().email,
                          firstHack: user.data().firstHack,
                          priorExperience: user.data().priorExperience,
                          whyThisHackathon: user.data().whyThisHackathon,
                        };
                        setApplicants((applicants: Applicant[]) => [
                          ...applicants,
                          currApplicant,
                        ]);
                      }
                    });
                  }
                  setPasswordPopup(false);
                } else {
                  window.location.reload();
                }
              }}
            >
              Log in
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default App;
