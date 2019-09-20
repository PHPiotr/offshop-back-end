const possibleStatuses = ['LOCAL_SOFT_DELETED', 'LOCAL_NEW_INITIATED', 'LOCAL_NEW_REJECTED', 'LOCAL_NEW_COMPLETED', 'NEW', 'PENDING', 'WAITING_FOR_CONFIRMATION', 'COMPLETED', 'CANCELED', 'REJECTED'];
const possibleStatusesLabels = {
    LOCAL_SOFT_DELETED: 'usunięta z bazy danych sklepu',
    LOCAL_NEW_INITIATED: 'zainicjowana w bazie danych sklepu',
    LOCAL_NEW_REJECTED: 'odrzucona w bazie danych sklepu',
    LOCAL_NEW_COMPLETED: 'zakończona w bazie danych sklepu',
    NEW: 'nowa',
    PENDING: 'w trakcie realizacji',
    WAITING_FOR_CONFIRMATION: 'oczekująca na potwierdzenie',
    COMPLETED: 'opłacona',
    CANCELED: 'odwołana',
    REJECTED: 'odrzucona',
};

module.exports.possibleOrderStatuses = possibleStatuses;
module.exports.possibleOrderStatusesLabels = possibleStatusesLabels;
