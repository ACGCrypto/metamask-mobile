import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View, TouchableOpacity, Clipboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, fontStyles } from '../../styles/common';
import Identicon from '../Identicon';
import { fromWei, toGwei, weiToFiat, hexToBN, isBN, toBN } from '../../util/number';
import { renderFullAddress } from '../../util/address';
import { toLocaleDateTime } from '../../util/date';
import { strings } from '../../../locales/i18n';

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: colors.concrete
	},
	row: {
		backgroundColor: colors.white,
		flex: 1,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: colors.borderColor
	},
	rowContent: {
		padding: 15
	},
	date: {
		color: colors.fontSecondary,
		fontSize: 12,
		marginBottom: 10,
		...fontStyles.normal
	},
	info: {
		marginLeft: 15
	},
	address: {
		fontSize: 15,
		color: colors.fontPrimary,
		...fontStyles.normal
	},
	status: {
		marginTop: 5,
		paddingVertical: 3,
		paddingHorizontal: 5,
		textAlign: 'center',
		backgroundColor: colors.concrete,
		color: colors.gray,
		fontSize: 9,
		letterSpacing: 0.5,
		...fontStyles.bold
	},
	statusConfirmed: {
		backgroundColor: colors.lightSuccess,
		color: colors.success
	},
	statusSubmitted: {
		backgroundColor: colors.lightWarning,
		color: colors.warning
	},
	amount: {
		fontSize: 15,
		color: colors.fontPrimary,
		...fontStyles.normal
	},
	amountFiat: {
		fontSize: 12,
		color: colors.fontSecondary,
		...fontStyles.normal
	},
	amounts: {
		flex: 1,
		alignItems: 'flex-end'
	},
	subRow: {
		flexDirection: 'row'
	},
	detailRowWrapper: {
		flex: 1,
		backgroundColor: colors.concrete,
		paddingVertical: 10,
		paddingHorizontal: 15
	},
	detailRowTitle: {
		flex: 1,
		paddingVertical: 10,
		fontSize: 15,
		color: colors.fontPrimary,
		...fontStyles.normal
	},
	detailRowInfo: {
		borderRadius: 5,
		shadowColor: colors.accentGray,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.5,
		shadowRadius: 3,
		backgroundColor: colors.white,
		padding: 10,
		marginBottom: 5
	},
	detailRowInfoItem: {
		flex: 1,
		flexDirection: 'row',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: colors.borderColor,
		marginBottom: 10,
		paddingBottom: 5
	},
	noBorderBottom: {
		borderBottomWidth: 0
	},
	detailRowText: {
		flex: 1,
		fontSize: 12,
		color: colors.fontSecondary,
		...fontStyles.normal
	},
	alignLeft: {
		textAlign: 'left'
	},
	alignRight: {
		textAlign: 'right'
	},
	viewOnEtherscan: {
		fontSize: 14,
		color: colors.primary,
		...fontStyles.normal,
		textAlign: 'center',
		marginTop: 15,
		marginBottom: 10
	},
	hash: {
		fontSize: 12
	},
	singleRow: {
		flexDirection: 'row'
	},
	copyIcon: {
		paddingRight: 5
	}
});

/**
 * View that renders a list of transactions for a specific asset
 */
export default class Transactions extends Component {
	static propTypes = {
		/**
		 * ETH to currnt currency conversion rate
		 */
		conversionRate: PropTypes.number,
		/**
		 * Currency code of the currently-active currency
		 */
		currentCurrency: PropTypes.string,
		/**
		/* navigation object required to push new views
		*/
		navigation: PropTypes.object,
		/**
		 * An array of transactions objects
		 */
		transactions: PropTypes.array,
		/**
		 * Callback function that will adjust the scroll
		 * position once the transaction detail is visible
		 */
		adjustScroll: PropTypes.func
	};

	state = {
		selectedTx: null
	};

	viewOnEtherscan = (hash, networkID) => {
		const isRopsten = networkID === '3';
		const url = `https://${isRopsten ? 'ropsten.' : ''}etherscan.io/tx/${hash}`;
		this.props.navigation.navigate('BrowserView', {
			url
		});
	};

	toggleDetailsView(hash, index) {
		const show = this.state.selectedTx !== hash;
		this.setState({ selectedTx: show ? hash : null });
		if (show) {
			this.props.adjustScroll(index);
		}
	}

	renderCopyIcon(str) {
		function copy() {
			Clipboard.setString(str);
		}
		return (
			<TouchableOpacity style={styles.copyIcon} onPress={copy}>
				<Icon name={'copy'} size={15} color={colors.primary} />
			</TouchableOpacity>
		);
	}

	renderTxDetails(tx) {
		const {
			transaction: { gas, gasPrice, value, to, from },
			transactionHash
		} = tx;
		const { conversionRate, currentCurrency } = this.props;
		const totalGas = isBN(gas) && isBN(gasPrice) ? gas.mul(gasPrice) : toBN('0x0');
		const amount = hexToBN(value);
		const total = isBN(amount) ? amount.add(totalGas) : totalGas;

		return (
			<View style={styles.detailRowWrapper}>
				<Text style={styles.detailRowTitle}>{strings('transactions.hash')}</Text>
				<View style={[styles.detailRowInfo, styles.singleRow]}>
					<Text style={[styles.detailRowText, styles.hash]}>{`${transactionHash.substr(
						0,
						20
					)} ... ${transactionHash.substr(-20)}`}</Text>
					{this.renderCopyIcon(transactionHash)}
				</View>
				<Text style={styles.detailRowTitle}>{strings('transactions.from')}</Text>
				<View style={[styles.detailRowInfo, styles.singleRow]}>
					<Text style={styles.detailRowText}>{renderFullAddress(from)}</Text>
				</View>
				<Text style={styles.detailRowTitle}>{strings('transactions.to')}</Text>
				<View style={[styles.detailRowInfo, styles.singleRow]}>
					<Text style={styles.detailRowText}>{renderFullAddress(to)}</Text>
				</View>
				<Text style={styles.detailRowTitle}>{strings('transactions.details')}</Text>
				<View style={styles.detailRowInfo}>
					<View style={styles.detailRowInfoItem}>
						<Text style={[styles.detailRowText, styles.alignLeft]}>{strings('transactions.amount')}</Text>
						<Text style={[styles.detailRowText, styles.alignRight]}>{fromWei(value, 'ether')} ETH</Text>
					</View>
					<View style={styles.detailRowInfoItem}>
						<Text style={[styles.detailRowText, styles.alignLeft]} />
						<Text style={[styles.detailRowText, styles.alignRight]}>{hexToBN(gas).toNumber()}</Text>
					</View>
					<View style={styles.detailRowInfoItem}>
						<Text style={[styles.detailRowText, styles.alignLeft]}>
							{strings('transactions.gas_price')}
						</Text>
						<Text style={[styles.detailRowText, styles.alignRight]}>{toGwei(gasPrice)}</Text>
					</View>
					<View style={styles.detailRowInfoItem}>
						<Text style={[styles.detailRowText, styles.alignLeft]}>{strings('transactions.total')}</Text>
						<Text style={[styles.detailRowText, styles.alignRight]}>{fromWei(total, 'ether')} ETH</Text>
					</View>
					<View style={[styles.detailRowInfoItem, styles.noBorderBottom]}>
						<Text style={[styles.detailRowText, styles.alignRight]}>
							{weiToFiat(total, conversionRate, currentCurrency).toUpperCase()}
						</Text>
					</View>
				</View>
				<TouchableOpacity
					onPress={() => this.viewOnEtherscan(tx.transactionHash, tx.networkID)} // eslint-disable-line react/jsx-no-bind
				>
					<Text style={styles.viewOnEtherscan}>{strings('transactions.view_on_etherscan')}</Text>
				</TouchableOpacity>
			</View>
		);
	}

	getStatusStyle(status) {
		if (status === 'confirmed') {
			return styles.statusConfirmed;
		} else if (status === 'submitted' || 'approved') {
			return styles.statusSubmitted;
		}
		return null;
	}

	render() {
		const { transactions, currentCurrency, conversionRate } = this.props;
		transactions.sort((a, b) => (a.time > b.time ? -1 : b.time > a.time ? 1 : 0));

		return (
			<View style={styles.wrapper}>
				<View testID={'transactions'}>
					{transactions.map((tx, i) => (
						<TouchableOpacity
							style={styles.row}
							key={`tx-${tx.id}`}
							onPress={() => this.toggleDetailsView(tx.transactionHash, i)} // eslint-disable-line react/jsx-no-bind
						>
							<View style={styles.rowContent}>
								<Text style={styles.date}>{`#${hexToBN(
									tx.transaction.nonce
								).toString()} - ${toLocaleDateTime(tx.time)}`}</Text>
								<View style={styles.subRow}>
									<Identicon address={tx.transaction.to} diameter={24} />
									<View style={styles.info}>
										<Text style={styles.address}>{strings('transactions.sent_ether')}</Text>
										<Text style={[styles.status, this.getStatusStyle(tx.status)]}>
											{tx.status.toUpperCase()}
										</Text>
									</View>
									<View style={styles.amounts}>
										<Text style={styles.amount}>
											- {fromWei(tx.transaction.value, 'ether')} ETH
										</Text>
										<Text style={styles.amountFiat}>
											-{' '}
											{weiToFiat(
												hexToBN(tx.transaction.value),
												conversionRate,
												currentCurrency
											).toUpperCase()}
										</Text>
									</View>
								</View>
							</View>
							{tx.transactionHash === this.state.selectedTx ? this.renderTxDetails(tx) : null}
						</TouchableOpacity>
					))}
				</View>
			</View>
		);
	}
}