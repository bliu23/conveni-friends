import React from 'react';
import axios from 'axios';
import moment from 'moment';

import { AsyncStorage, Button, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import RequestInfoLine from 'client/app/components/RequestInfoDetails';
import CustomButton from 'client/app/components/CustomButton';
import User from 'client/app/Common/User';

import { getUser } from 'client/app/utils';
import styles from 'client/styles/style';
import config from 'client/config';
import Moment from 'react-moment'; // 0.6.8

export default class RequestDetailsScreen extends React.Component {
	static navigationOptions = {
		title: 'Request Details',
	}

	constructor(props) {
		super(props);

		this.state = {
			userId: '',
			request: {},
		};
		this.getButtons = this.getButtons.bind(this);
		this.accept = this.accept.bind(this);
		this.complete = this.complete.bind(this);
		this.messageRequester = this.messageRequester.bind(this);
	}

	componentWillMount() {
		const { request } = this.props.navigation.state.params;

		AsyncStorage.getItem('userId')
			.then(userId => this.setState({ userId, request }));
	}

	componentWillUnmount () {
		if(this.state.request.accepted) {
			this.props.navigation.state.params.onNavigateBack(this.state.request.requestId);
		} else {
			this.props.navigation.state.params.onNavigateBack(null);
		}
	}

	getButtons() {
		const { userId, request } = this.state;
		const { requesterId, providerId, accepted, confirmed, completed } = request;
        // Can't accept/complete your own requests or a request that's already taken
		if (userId === requesterId) {
			return;
		}
		if (!accepted) {
			return <CustomButton text="Accept" onPressHandle={() => this.accept()} />;
		} else if (userId == providerId && !completed) {
			return <CustomButton text="Complete" onPressHandle={() => this.complete()} />;
		}
		return;
	}

	accept() {
		const { userId, request } = this.state;
		const { requesterId, requestId } = request;
		let time = moment().format('YYYY-MM-DD HH:MM:SS');
		time = time.slice(0,17) + '00';
		axios.post(`${config.API_URL}/v1/request/${requestId}/accept`, {
			userId,
			time: moment().format('YYYY-MM-DD HH:MM:SS')
		})
			.then(response => {
				if(response.status === 200) {
					const { request } = this.state;
					this.setState({ request: { ...request, accepted: true }});
				}
			})
			.catch(err => {
				console.log('error in post request');
				console.log(err);
			});
	}

	complete() {
		const { userId, request } = this.state;
		const { requesterId, requestId } = request;
		let time = moment().format('YYYY-MM-DD HH:MM:SS');
		time = time.slice(0,17) + '00';
		axios.post(`${config.API_URL}/v1/request/${requestId}/complete`, {
			userId,
			time: time
		})
			.then(response => {
				console.log('complete');
				if (response.status === 200) {
					const { request } = this.state;
					this.setState({ request: { ...request, accepted: true }});
				}
			})
			.catch(err => {
				console.log(err);
			})
	}

	messageRequester() {
		const navigation = this.props.navigation;
		const { userId, request } = this.state;
		const { requesterId } = request;

		axios.post(`${config.API_URL}/v1/message/session/create`, {
			userId1: userId,
			userId2: requesterId
		})
			.then(response => JSON.parse(response.data))
			.then(messageSession => {
				navigation.navigate('MessageScreen', {
					messageSessionId: messageSession.messageSessionId,
					userId,
					otherUserId: requesterId
				});
			});
	}

	render() {
		const { userId, request } = this.state;
		const { requesterId, title, address, description } = request;
		const { timeStart, timeEnd, accepted, confirmed, completed } = request;

		return (
			<View style={styles.simpleContainer}>
				<ScrollView style={styles.detailsMakeContainer}>
					<View style={styles.makeInputView}>
						<RequestInfoLine primary={'Request'} secondary={' ' + title} />
						<RequestInfoLine primary={'Location'} secondary={' ' + address} />
						<RequestInfoLine primary={'Start Time'} secondary={' ' + timeStart} />
						<RequestInfoLine primary={'End Time'} secondary={' ' + timeEnd} />
						<Text style={styles.key}>Details: <Text style={styles.value}>{' ' + description}</Text></Text>
					</View>

					{ this.getButtons() }

					{ userId === request.requesterId ||
						<CustomButton
							text="Message Requester"
							onPressHandle={() => this.messageRequester()}
						/>
					}
				</ScrollView>
			</View>
		);
	}
}
