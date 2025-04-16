
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        {selectedFine && (
          <TrafficFineEditDialog 
            trafficFine={selectedFine}
            onSave={handleEditComplete}
            onCancel={() => setShowEditDialog(false)}
          />
        )}
      </Dialog>
