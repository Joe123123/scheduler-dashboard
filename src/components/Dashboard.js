import React, { Component } from "react";

import classnames from "classnames";
import axios from "axios";

import Loading from "./Loading";
import Panel from "./Panel";
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      focused: null,
      days: [],
      appointments: {},
      interviewers: {}
    };
  }

  selectPanel(id) {
    this.setState(prevStates => ({
      focused: prevStates.focused ? null : id
    }));
  }

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });
  }

  componentWillUnmount() {
    this.socket.close();
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });

    if (this.state.loading) {
      return <Loading />;
    }

    const data = [
      {
        id: 1,
        label: "Total Interviews",
        getValue: getTotalInterviews
      },
      {
        id: 2,
        label: "Least Popular Time Slot",
        getValue: getLeastPopularTimeSlot
      },
      {
        id: 3,
        label: "Most Popular Day",
        getValue: getMostPopularDay
      },
      {
        id: 4,
        label: "Interviews Per Day",
        getValue: getInterviewsPerDay
      }
    ];

    return (
      <main className={dashboardClasses}>
        {data
          .filter(
            panel =>
              this.state.focused === null || this.state.focused === panel.id
          )
          .map(({ id, label, getValue }) => (
            <Panel
              key={id}
              label={label}
              value={getValue(this.state)}
              onSelect={() => this.selectPanel(id)}
            />
          ))}
      </main>
    );
  }
}

export default Dashboard;
